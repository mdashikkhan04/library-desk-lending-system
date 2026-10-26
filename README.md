# Library Desk

Small React + Express app for a library front desk: members borrow books,
staff see what is on the shelf and who holds what.

```
server/   Express API. State + history are saved in server/data/library-log.json
src/      React app (Vite)
```

```bash
npm install
npm run dev     # API on :3001, web on :5173
```

## Screens (no login for now)

| URL | For | What it does |
|---|---|---|
| `/member` | Members | Full catalogue, filter **All / Available / Unavailable**, search. **Lend** is enabled only when a copy is available. Pressing it asks for **Member ID + Username**; if they match a library member the book is lent to them. |
| `/staff` | Staff | **Books**: every book with availability, and *who holds it* (name, ID, username, since when) plus a Return button. **Members**: each member and the books they hold. **History**: every lend/return, newest first. |

Demo members: `m1` / `alex` (Alex Rivera), `m2` / `sam` (Sam Okafor).

## The log file

Every lend and return is written to `server/data/library-log.json`: the current
snapshot (books, members, loans) **and** the full event history. The staff
screens read from it through the API, and it survives restarts. Delete the file
(or `POST /api/_reset`) to go back to the seed data. It is git-ignored.

## Rules kept from the original

Max 3 books per member; the API randomly fails ~20% of writes (set
`FAIL_RATE=0` to turn that off). The UI survives this: retries reuse one
`Idempotency-Key`, so a book is never lent or returned twice.
