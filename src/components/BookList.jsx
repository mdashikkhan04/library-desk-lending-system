import { useCallback, useState } from 'react';
import { useBookSearch } from '../hooks/useBookSearch.js';
import { useBorrow } from '../hooks/useBorrow.js';
import { getBorrowBlock } from '../lib/rules.js';
import BookCard from './BookCard.jsx';

export default function BookList({ memberId, loans, loansStatus, onLoanAdded, onLoansStale }) {
  const [query, setQuery] = useState('');
  const { books, status, error, patchBook, reload } = useBookSearch(query);

  // Success: show the server's new stock count and the new loan right away.
  const handleBorrowed = useCallback(
    ({ loan, book }) => {
      patchBook(book);
      onLoanAdded(loan);
    },
    [patchBook, onLoanAdded],
  );

  // The server said "no" because our screen was stale: refresh both panels.
  const handleStale = useCallback(() => {
    reload();
    onLoansStale();
  }, [reload, onLoansStale]);

  const { attempt, borrow } = useBorrow({
    memberId,
    onBorrowed: handleBorrowed,
    onStale: handleStale,
  });

  // The loan limit depends on the loans, so don't allow lending until we know them.
  // Only one borrow at a time: two in flight could race past the limit.
  const loansReady = loansStatus === 'ready';
  const locked = !loansReady || attempt?.status === 'pending';

  return (
    <div>
      <input
        className="search"
        type="search"
        placeholder="Search by title or author"
        aria-label="Search books by title or author"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {status === 'loading' && <p className="muted">Loading…</p>}
      {status === 'error' && (
        <p className="error" role="alert">
          {error.message}{' '}
          <button className="link-btn" onClick={reload}>
            Try again
          </button>
        </p>
      )}
      <ul className="book-list">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            blockReason={loansReady ? getBorrowBlock(book, loans) : null}
            attempt={attempt?.bookId === book.id ? attempt : null}
            locked={locked}
            onBorrow={borrow}
          />
        ))}
      </ul>
      {status === 'ready' && books.length === 0 && <p className="muted">No books found.</p>}
    </div>
  );
}
