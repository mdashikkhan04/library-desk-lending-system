import { useState } from 'react';
import { useCatalogue } from '../hooks/useCatalogue.js';
import { useLend } from '../hooks/useLend.js';
import Layout from '../components/Layout.jsx';
import CatalogueControls from '../components/CatalogueControls.jsx';
import BookCard from '../components/BookCard.jsx';
import BookListStatus from '../components/BookListStatus.jsx';
import LendDialog from '../components/LendDialog.jsx';

export default function MemberPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [lendingBook, setLendingBook] = useState(null); // the book whose dialog is open
  const [notice, setNotice] = useState(null);

  const { books, status, error, reload } = useCatalogue({ query, status: filter });
  const refresh = () => reload({ quiet: true });

  const { attempt, run, clear } = useLend({
    onLent: ({ loan }) => {
      setLendingBook(null);
      setNotice(`“${loan.title}” was lent to ${loan.memberName} (${loan.memberId}).`);
      refresh();
    },
    onStale: refresh, // someone else may have taken the last copy
  });

  const closeDialog = () => {
    clear();
    setLendingBook(null);
  };

  return (
    <Layout title="Library catalogue" subtitle="Member" current="/member">
      {notice && (
        <p className="notice" role="status">
          {notice}{' '}
          <button type="button" className="link-btn" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </p>
      )}

      <section className="panel">
        <CatalogueControls query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} />
        <BookListStatus status={status} error={error} count={books.length} onRetry={reload} />
        <ul className="book-list">
          {books.map((book) => {
            const available = book.copies > 0;
            return (
              <BookCard
                key={book.id}
                book={book}
                actions={
                  <button
                    type="button"
                    className="btn"
                    disabled={!available}
                    onClick={() => {
                      setNotice(null);
                      setLendingBook(book);
                    }}
                    aria-label={`Lend ${book.title}`}
                  >
                    Lend
                  </button>
                }
              >
                {!available && <div className="reason muted">All copies are currently lent out</div>}
              </BookCard>
            );
          })}
        </ul>
      </section>

      {lendingBook && (
        <LendDialog
          key={lendingBook.id}
          book={lendingBook}
          attempt={attempt}
          onEdit={clear}
          onClose={closeDialog}
          onSubmit={(member) => run({ bookId: lendingBook.id, ...member })}
        />
      )}
    </Layout>
  );
}
