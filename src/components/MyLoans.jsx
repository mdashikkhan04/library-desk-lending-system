import { MAX_LOANS } from '../lib/rules.js';

const formatDate = (iso) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));

export default function MyLoans({ loans, status, error, onRetry }) {
  if (status === 'loading') return <p className="muted">Loading loans…</p>;

  if (status === 'error') {
    return (
      <p className="error" role="alert">
        {error.message}{' '}
        <button className="link-btn" onClick={onRetry}>
          Try again
        </button>
      </p>
    );
  }

  if (loans.length === 0) return <p className="muted">No books on loan.</p>;

  return (
    <>
      <p className="muted loan-count">
        {loans.length} of {MAX_LOANS} books on loan
      </p>
      <ul className="loan-list">
        {loans.map((loan) => (
          <li key={loan.id} className="loan">
            <div className="book-title">{loan.title}</div>
            <div className="muted">Borrowed {formatDate(loan.borrowedAt)}</div>
          </li>
        ))}
      </ul>
    </>
  );
}
