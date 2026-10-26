export default function BookCard({ book, children, actions }) {
  const available = book.copies > 0;
  return (
    <li className="book-card">
      <div className="book-main">
        <div className="book-title">
          {book.title}{' '}
          <span className={available ? 'badge badge-ok' : 'badge badge-out'}>
            {available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <div className="muted">{book.author}</div>
        <div className="copies">
          {book.copies} of {book.totalCopies} {book.totalCopies === 1 ? 'copy' : 'copies'} available
        </div>
        {children}
      </div>
      {actions && <div className="book-actions">{actions}</div>}
    </li>
  );
}
