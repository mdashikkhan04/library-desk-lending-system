import express from 'express';
import { fileURLToPath } from 'node:url';
import { db, resetData, save, recordEvent } from './data.js';

const PORT = Number(process.env.PORT ?? 3001);
const MAX_LOANS = 3;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const STATUS_FILTERS = ['all', 'available', 'unavailable'];

// Simulated flakiness for write endpoints (0 to 1).
let failRate = Number(process.env.FAIL_RATE ?? 0.2);

// key -> { fingerprint, reply, expiresAt }
const idempotencyCache = new Map();

export const app = express();
app.use(express.json());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (res, status, code, message) => res.status(status).json({ code, message });
const norm = (value) => String(value ?? '').trim().toLowerCase();

const findBook = (id) => db.books.find((b) => b.id === id);
const findMember = (id) => db.members.find((m) => m.id === id);

const toLoanView = (loan) => ({
  ...loan,
  title: findBook(loan.bookId)?.title,
  memberName: findMember(loan.memberId)?.name,
});

// Who currently holds a copy of a book (staff-only information).
const toHolderView = (loan) => {
  const member = findMember(loan.memberId);
  return {
    loanId: loan.id,
    memberId: loan.memberId,
    memberName: member?.name,
    username: member?.username,
    borrowedAt: loan.borrowedAt,
  };
};

function filterBooks(q, status) {
  return db.books.filter((b) => {
    const textMatch = b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const statusMatch =
      status === 'all' || (status === 'available' ? b.copies > 0 : b.copies < 1);
    return textMatch && statusMatch;
  });
}

// Reads ?q= and ?status= ; returns null (and responds 400) when status is invalid.
function readCatalogueQuery(req, res) {
  const q = norm(req.query.q);
  const status = norm(req.query.status || 'all');
  if (!STATUS_FILTERS.includes(status)) {
    fail(res, 400, 'BAD_STATUS', `status must be one of: ${STATUS_FILTERS.join(', ')}.`);
    return null;
  }
  return { q, status };
}

// --- reads (members and staff) -------------------------------------------------

app.get('/api/books', async (req, res) => {
  const query = readCatalogueQuery(req, res);
  if (!query) return;
  // Shorter queries are slower, like a real search backend scanning more rows.
  await sleep(Math.max(80, 400 - query.q.length * 100) + Math.random() * 100);
  res.json(filterBooks(query.q, query.status));
});

app.get('/api/members/:id', async (req, res) => {
  await sleep(150);
  const member = findMember(req.params.id);
  if (!member) return fail(res, 404, 'MEMBER_NOT_FOUND', 'No such member.');
  res.json({ id: member.id, name: member.name });
});

app.get('/api/members/:id/loans', async (req, res) => {
  await sleep(200);
  if (!findMember(req.params.id)) return fail(res, 404, 'MEMBER_NOT_FOUND', 'No such member.');
  res.json(db.loans.filter((l) => l.memberId === req.params.id).map(toLoanView));
});

// --- reads (staff only: who holds what) -------------------------------------------

// Every book, plus who holds each copy that is out.
app.get('/api/staff/books', (req, res) => {
  const query = readCatalogueQuery(req, res);
  if (!query) return;
  const books = filterBooks(query.q, query.status).map((book) => ({
    ...book,
    holders: db.loans.filter((l) => l.bookId === book.id).map(toHolderView),
  }));
  res.json(books);
});

// Every member, plus the books they currently hold.
app.get('/api/staff/members', (_req, res) => {
  res.json(
    db.members.map((member) => ({
      ...member,
      maxLoans: MAX_LOANS,
      loans: db.loans.filter((l) => l.memberId === member.id).map(toLoanView),
    })),
  );
});

// Lend/return history, newest first.
app.get('/api/staff/events', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  res.json([...db.events].reverse().slice(0, limit));
});

// --- writes ----------------------------------------------------------------

// Decides whether this call will misbehave: 'ok' | 'fail-before' | 'fail-after'.
function rollChaos() {
  const r = Math.random();
  if (r < failRate / 2) return 'fail-before';
  if (r < failRate) return 'fail-after';
  return 'ok';
}

function remember(key, fingerprint, reply) {
  // A snapshot, so later changes to books/loans never alter an old answer.
  idempotencyCache.set(key, {
    fingerprint,
    reply: structuredClone(reply),
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  });
}

// Forget old keys so the cache can't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache) if (entry.expiresAt < now) idempotencyCache.delete(key);
}, 60 * 60 * 1000).unref();

function withIdempotency(handler) {
  return async (req, res) => {
    const key = req.get('Idempotency-Key');
    // A key only means something for the exact same request.
    const fingerprint = `${req.method} ${req.originalUrl} ${JSON.stringify(req.body ?? {})}`;

    const saved = key ? idempotencyCache.get(key) : null;
    if (saved && saved.expiresAt > Date.now()) {
      if (saved.fingerprint !== fingerprint) {
        return fail(res, 422, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used for a different request.');
      }
      const replay = structuredClone(saved.reply);
      return res.status(replay.status).json(replay.body);
    }

    const reply = await handler(req);
    if (key && reply.status < 500) remember(key, fingerprint, reply);
    // A real success is remembered even when the response never reaches the client.
    if (key && reply.lost) remember(key, fingerprint, reply.real);
    return res.status(reply.status).json(reply.body);
  };
}

app.post(
  '/api/books/:id/borrow',
  withIdempotency(async (req) => {
    await sleep(300 + Math.random() * 600);
    const { memberId, username } = req.body ?? {};
    const book = findBook(req.params.id);
    if (!book) return { status: 404, body: { code: 'BOOK_NOT_FOUND', message: 'No such book.' } };

    // The member identifies themselves with id + username; both must match.
    // One message for both cases, so the form can't be used to probe which ids exist.
    const member = typeof memberId === 'string' ? findMember(memberId.trim()) : undefined;
    if (!member || norm(username) !== norm(member.username)) {
      return {
        status: 403,
        body: { code: 'MEMBER_VERIFICATION_FAILED', message: "That member ID and username don't match a library member." },
      };
    }

    const memberLoans = db.loans.filter((l) => l.memberId === member.id);
    if (memberLoans.some((l) => l.bookId === book.id)) {
      return { status: 409, body: { code: 'ALREADY_BORROWED', message: 'Member already has this book.' } };
    }
    if (memberLoans.length >= MAX_LOANS) {
      return {
        status: 409,
        body: { code: 'LOAN_LIMIT_REACHED', message: `Members can hold at most ${MAX_LOANS} books.` },
      };
    }
    if (book.copies < 1) {
      return { status: 409, body: { code: 'OUT_OF_STOCK', message: 'No copies available.' } };
    }

    const chaos = rollChaos();
    if (chaos === 'fail-before') {
      return { status: 503, body: { code: 'UPSTREAM_UNAVAILABLE', message: 'Service unavailable, try again.' } };
    }

    book.copies -= 1;
    const loan = { id: `l${db.nextLoanId++}`, memberId: member.id, bookId: book.id, borrowedAt: new Date().toISOString() };
    db.loans.push(loan);
    recordEvent('LEND', { loan, book, member });
    save();
    const real = { status: 201, body: { loan: toLoanView(loan), book } };

    if (chaos === 'fail-after') {
      return {
        status: 504,
        body: { code: 'GATEWAY_TIMEOUT', message: 'Request timed out.' },
        lost: true,
        real,
      };
    }
    return real;
  }),
);

app.post(
  '/api/books/:id/return',
  withIdempotency(async (req) => {
    await sleep(300 + Math.random() * 600);
    const { memberId } = req.body ?? {};
    const book = findBook(req.params.id);
    if (!book) return { status: 404, body: { code: 'BOOK_NOT_FOUND', message: 'No such book.' } };
    const loan = db.loans.find((l) => l.memberId === memberId && l.bookId === book.id);
    if (!loan) return { status: 409, body: { code: 'NOT_BORROWED', message: 'Member does not have this book.' } };

    const chaos = rollChaos();
    if (chaos === 'fail-before') {
      return { status: 503, body: { code: 'UPSTREAM_UNAVAILABLE', message: 'Service unavailable, try again.' } };
    }

    const member = findMember(loan.memberId);
    db.loans = db.loans.filter((l) => l.id !== loan.id);
    book.copies += 1;
    recordEvent('RETURN', { loan, book, member });
    save();
    const real = { status: 200, body: { book } };

    if (chaos === 'fail-after') {
      return { status: 504, body: { code: 'GATEWAY_TIMEOUT', message: 'Request timed out.' }, lost: true, real };
    }
    return real;
  }),
);

// --- interviewer controls (not part of the app's API) -----------------------
// Development helpers: switched off when NODE_ENV=production.

if (process.env.NODE_ENV !== 'production') {
  app.post('/api/_chaos', (req, res) => {
    const rate = Number(req.body?.failRate);
    if (!(rate >= 0 && rate <= 1)) return fail(res, 400, 'BAD_RATE', 'failRate must be between 0 and 1.');
    failRate = rate;
    res.json({ failRate });
  });

  app.post('/api/_reset', (_req, res) => {
    resetData();
    idempotencyCache.clear();
    res.json({ ok: true });
  });
}

// Start listening only when run directly (`node server/index.js`), so the
// tests can import `app` and listen on a random port themselves.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}
