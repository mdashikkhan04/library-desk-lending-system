# Library Desk API

Base URL: `http://localhost:3001` (the Vite dev server proxies `/api` to it).
State and history are saved to `server/data/library-log.json` (override with
`LIBRARY_LOG_FILE`). Env: `PORT`, `FAIL_RATE` (0 to 1, default 0.2).

All errors look like `{ "code": "SOME_CODE", "message": "Human readable text" }`.

## Reads (members)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/books?q=&status=` | `status` is `all` (default), `available` or `unavailable`. Each book: `{ id, title, author, copies, totalCopies }`. Never says who holds a book. |
| GET | `/api/members/:id` | `{ id, name }` |
| GET | `/api/members/:id/loans` | `[{ id, memberId, memberName, bookId, title, borrowedAt }]` |

## Reads (staff)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/staff/books?q=&status=` | Same as `/api/books`, plus `holders: [{ loanId, memberId, memberName, username, borrowedAt }]` |
| GET | `/api/staff/members` | Each member `{ id, name, username, maxLoans, loans }` |
| GET | `/api/staff/events?limit=` | Lend/return history, newest first (default 100, max 500) |

## Writes

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/api/books/:id/borrow` | `{ "memberId": "m1", "username": "alex" }` | `201 { loan, book }` |
| POST | `/api/books/:id/return` | `{ "memberId": "m1" }` | `200 { book }` |

Borrow needs the member's **id and username to match** (else `403
MEMBER_VERIFICATION_FAILED`). Both accept an optional `Idempotency-Key` header.
Repeating the same request with the same key returns the original result
(a snapshot) instead of running it again; keys last 24h. Using a key for a
*different* request returns `422 IDEMPOTENCY_KEY_REUSED`.

Known members: `m1` / `alex` (Alex Rivera), `m2` / `sam` (Sam Okafor).

## Status codes

`400` bad query, `403` member details don't match, `404` unknown book or
member, `409` the request breaks a library rule (see `code`: `ALREADY_BORROWED`,
`LOAN_LIMIT_REACHED`, `OUT_OF_STOCK`, `NOT_BORROWED`), `422` key reused,
`5xx` the call did not complete cleanly.

`POST /api/_reset` and `/api/_chaos` are development helpers, disabled when
`NODE_ENV=production`.
