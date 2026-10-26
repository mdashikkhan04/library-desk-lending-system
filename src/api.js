export class ApiError extends Error {
  constructor(message, { status = 0, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 means "never got an HTTP response" (network down)
    this.code = code;
  }
  get retryable() {
    return this.status === 0 || this.status >= 500;
  }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(path, options);
  } catch (err) {
    if (err.name === 'AbortError') throw err; // caller cancelled on purpose
    throw new ApiError('Could not reach the server.', { status: 0, code: 'NETWORK' });
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, {
      status: res.status,
      code: body?.code,
    });
  }
  return body;
}

export const isAbort = (err) => err?.name === 'AbortError';

const catalogueUrl = (base, query, status) => {
  const params = new URLSearchParams({ q: query, status });
  return `${base}?${params}`;
};

// status: 'all' | 'available' | 'unavailable'
export const fetchBooks = (query = '', { status = 'all', signal } = {}) =>
  request(catalogueUrl('/api/books', query, status), { signal });

// Staff-only: same list, but each book also says who holds it.
export const fetchStaffBooks = (query = '', { status = 'all', signal } = {}) =>
  request(catalogueUrl('/api/staff/books', query, status), { signal });

export const fetchStaffMembers = ({ signal } = {}) => request('/api/staff/members', { signal });

export const fetchStaffEvents = ({ signal } = {}) => request('/api/staff/events?limit=100', { signal });

const post = (path, payload, idempotencyKey) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  });

export const borrowBook = (bookId, { memberId, username }, idempotencyKey) =>
  post(`/api/books/${bookId}/borrow`, { memberId, username }, idempotencyKey);

export const returnBook = (bookId, { memberId }, idempotencyKey) =>
  post(`/api/books/${bookId}/return`, { memberId }, idempotencyKey);
