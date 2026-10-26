// A "Return" button for one loan, with its own error message underneath.
export default function ReturnAction({ title, memberName, attempt, mine, locked, onReturn }) {
  const pending = mine && attempt.status === 'pending';
  const failed = mine && attempt.status === 'error';

  let label = 'Return';
  if (pending) label = 'Returning…';
  else if (failed && attempt.canRetry) label = 'Retry';

  return (
    <div className="return-action">
      <button
        type="button"
        className="btn btn-small"
        disabled={locked}
        onClick={onReturn}
        aria-label={`${label} ${title} from ${memberName}`}
      >
        {label}
      </button>
      {failed && (
        <div className="error reason" role="alert">
          {attempt.message}
        </div>
      )}
    </div>
  );
}
