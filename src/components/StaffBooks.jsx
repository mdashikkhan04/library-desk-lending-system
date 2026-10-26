import BookCard from './BookCard.jsx';
import BookListStatus from './BookListStatus.jsx';
import ReturnAction from './ReturnAction.jsx';
import { formatDate } from '../lib/format.js';

// Staff view of the catalogue: every book, and who holds each copy that is out.
export default function StaffBooks({ catalogue, returns }) {
  const { books, status, error, reload } = catalogue;
  return (
    <>
      <BookListStatus status={status} error={error} count={books.length} onRetry={reload} />
      <ul className="book-list">
        {books.map((book) => (
          <BookCard key={book.id} book={book}>
            {book.holders.length === 0 ? (
              <div className="reason muted">Nobody has borrowed this book.</div>
            ) : (
              <ul className="holders" aria-label={`Who has ${book.title}`}>
                {book.holders.map((holder) => {
                  const loan = { memberId: holder.memberId, bookId: book.id };
                  return (
                    <li key={holder.loanId} className="holder">
                      <div>
                        <strong>{holder.memberName}</strong>{' '}
                        <span className="muted">
                          · ID {holder.memberId} · @{holder.username} · since {formatDate(holder.borrowedAt)}
                        </span>
                      </div>
                      <ReturnAction
                        title={book.title}
                        memberName={holder.memberName}
                        attempt={returns.attempt}
                        mine={returns.isMine(loan)}
                        locked={returns.locked}
                        onReturn={() => returns.onReturn(loan)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </BookCard>
        ))}
      </ul>
    </>
  );
}
