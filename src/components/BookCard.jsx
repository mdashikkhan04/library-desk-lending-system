// Purely presentational: everything it needs arrives as props.
//   blockReason - why lending is not allowed (string) or null
//   attempt     - this book's current borrow attempt, or null
//   locked      - true while ANY borrow is running or loans aren't loaded yet
export default function BookCard({ book, blockReason, attempt, locked, onBorrow }) {
  const pending = attempt?.status === 'pending';
  const failed = attempt?.status === 'error';

  let label = 'Borrow';
  if (pending) label = 'Borrowing…';
  else if (failed && attempt.canRetry) label = 'Retry';

  return (
    <li className="book-card">
      <div>
        <div className="book-title">{book.title}</div>
        <div className="muted">{book.author}</div>
        <div className="copies">
          {book.copies > 0 ? `${book.copies} available` : 'None available'}
        </div>
        {blockReason && <div className="reason muted">{blockReason}</div>}
        {failed && (
          <div className="error reason" role="alert">
            {attempt.message}
          </div>
        )}
      </div>
      <button
        className="btn"
        disabled={locked || (!attempt?.canRetry && Boolean(blockReason))}
        onClick={() => onBorrow(book.id)}
        aria-label={`${label} ${book.title}`}
      >
        {label}
      </button>
    </li>
  );
}
