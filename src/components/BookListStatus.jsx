// Loading / error / empty messages under a book list.
export default function BookListStatus({ status, error, count, onRetry }) {
  if (status === 'error') {
    return (
      <p className="error" role="alert">
        {error.message}{' '}
        <button type="button" className="link-btn" onClick={onRetry}>
          Try again
        </button>
      </p>
    );
  }
  if (status === 'loading') return <p className="muted" role="status">Loading…</p>;
  if (count === 0) return <p className="muted">No books found.</p>;
  return null;
}
