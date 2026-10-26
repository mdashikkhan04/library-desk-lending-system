// Thin wrapper around fetch. Every failure becomes an ApiError so the UI can
// reason about it with one shape: { message, status, code, retryable }.

export class ApiError extends Error {
  constructor(message, { status = 0, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 means "never got an HTTP response" (network down)
    this.code = code;
  }

  // 5xx and network failures are "outcome unknown": the server may or may not
  // have done the work. 4xx are definitive answers and must not be retried.
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

export const fetchMember = (memberId, { signal } = {}) =>
  request(`/api/members/${memberId}`, { signal });

export const fetchBooks = (query = '', { signal } = {}) =>
  request(`/api/books?q=${encodeURIComponent(query)}`, { signal });

export const fetchLoans = (memberId, { signal } = {}) =>
  request(`/api/members/${memberId}/loans`, { signal });

// The Idempotency-Key identifies ONE staff intent ("lend this book to this
// member"), not one HTTP attempt. Retries of the same intent reuse the key.
export const borrowBook = (bookId, memberId, idempotencyKey) =>
  request(`/api/books/${bookId}/borrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ memberId }),
  });

export const returnBook = (bookId, memberId, idempotencyKey) =>
  request(`/api/books/${bookId}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ memberId }),
  });
