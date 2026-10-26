import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const LOG_FILE = process.env.LIBRARY_LOG_FILE ?? path.join(here, 'data', 'library-log.json');

const seedBooks = () => [
  { id: 'b1', title: 'Dune', author: 'Frank Herbert', copies: 2, totalCopies: 2 },
  { id: 'b2', title: 'Neuromancer', author: 'William Gibson', copies: 1, totalCopies: 1 },
  { id: 'b3', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', copies: 3, totalCopies: 4 },
  { id: 'b4', title: 'The Dispossessed', author: 'Ursula K. Le Guin', copies: 1, totalCopies: 1 },
  { id: 'b5', title: 'Snow Crash', author: 'Neal Stephenson', copies: 0, totalCopies: 1 },
  { id: 'b6', title: 'Foundation', author: 'Isaac Asimov', copies: 2, totalCopies: 2 },
  { id: 'b7', title: 'I, Robot', author: 'Isaac Asimov', copies: 1, totalCopies: 1 },
  { id: 'b8', title: 'Hyperion', author: 'Dan Simmons', copies: 1, totalCopies: 1 },
  { id: 'b9', title: 'The Martian', author: 'Andy Weir', copies: 4, totalCopies: 5 },
  { id: 'b10', title: 'Kindred', author: 'Octavia E. Butler', copies: 2, totalCopies: 2 },
  { id: 'b11', title: 'Parable of the Sower', author: 'Octavia E. Butler', copies: 0, totalCopies: 1 },
  { id: 'b12', title: 'Solaris', author: 'Stanisław Lem', copies: 2, totalCopies: 2 },
];

// A member identifies themselves at the desk with id + username.
const seedMembers = () => [
  { id: 'm1', name: 'Alex Rivera', username: 'alex' },
  { id: 'm2', name: 'Sam Okafor', username: 'sam' },
];

const seedLoans = () => [
  { id: 'l1', memberId: 'm1', bookId: 'b3', borrowedAt: '2026-10-12T09:30:00.000Z' },
  { id: 'l2', memberId: 'm1', bookId: 'b9', borrowedAt: '2026-10-19T14:05:00.000Z' },
  { id: 'l3', memberId: 'm2', bookId: 'b5', borrowedAt: '2026-10-15T11:00:00.000Z' },
  { id: 'l4', memberId: 'm2', bookId: 'b11', borrowedAt: '2026-10-17T16:20:00.000Z' },
];

const seedEvents = () => [
  { id: 'e1', type: 'LEND', at: '2026-10-12T09:30:00.000Z', loanId: 'l1', bookId: 'b3', bookTitle: 'The Left Hand of Darkness', memberId: 'm1', memberName: 'Alex Rivera' },
  { id: 'e2', type: 'LEND', at: '2026-10-19T14:05:00.000Z', loanId: 'l2', bookId: 'b9', bookTitle: 'The Martian', memberId: 'm1', memberName: 'Alex Rivera' },
  { id: 'e3', type: 'LEND', at: '2026-10-15T11:00:00.000Z', loanId: 'l3', bookId: 'b5', bookTitle: 'Snow Crash', memberId: 'm2', memberName: 'Sam Okafor' },
  { id: 'e4', type: 'LEND', at: '2026-10-17T16:20:00.000Z', loanId: 'l4', bookId: 'b11', bookTitle: 'Parable of the Sower', memberId: 'm2', memberName: 'Sam Okafor' },
].sort((a, b) => a.at.localeCompare(b.at)); // history is kept oldest-first

const seedState = () => ({
  books: seedBooks(),
  members: seedMembers(),
  loans: seedLoans(),
  events: seedEvents(),
  nextLoanId: 5,
  nextEventId: 5,
});

export const db = seedState();

export function save() {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  const tmp = `${LOG_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, LOG_FILE);
}

function load() {
  if (!fs.existsSync(LOG_FILE)) {
    save();
    return;
  }
  try {
    const saved = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    const ok = ['books', 'members', 'loans', 'events'].every((k) => Array.isArray(saved[k]));
    if (!ok) throw new Error('log file has an unexpected shape');
    Object.assign(db, saved);
  } catch (err) {
    // Don't silently destroy a damaged log: keep a copy, then start fresh.
    const backup = `${LOG_FILE}.corrupt-${Date.now()}`;
    fs.copyFileSync(LOG_FILE, backup);
    console.warn(`Could not read ${LOG_FILE} (${err.message}). Saved a copy to ${backup} and reset.`);
    save();
  }
}

// Append one lend/return event to the history. Call save() afterwards.
export function recordEvent(type, { loan, book, member }) {
  db.events.push({
    id: `e${db.nextEventId++}`,
    type, // 'LEND' | 'RETURN'
    at: new Date().toISOString(),
    loanId: loan.id,
    bookId: book.id,
    bookTitle: book.title,
    memberId: member.id,
    memberName: member.name,
  });
}

export function resetData() {
  Object.assign(db, seedState());
  save();
}

load();
