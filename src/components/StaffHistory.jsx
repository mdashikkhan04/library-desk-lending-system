import { formatDateTime } from '../lib/format.js';

// The event history from the log file: every lend and return, newest first.
export default function StaffHistory({ resource }) {
  const { data: events, status, error, reload } = resource;

  if (status === 'error') {
    return (
      <p className="error" role="alert">
        {error.message}{' '}
        <button type="button" className="link-btn" onClick={reload}>
          Try again
        </button>
      </p>
    );
  }
  if (!events) return <p className="muted" role="status">Loading…</p>;
  if (events.length === 0) return <p className="muted">Nothing has been lent yet.</p>;

  return (
    <div className="table-wrap">
      <table className="history">
        <caption className="sr-only">Lend and return history, newest first</caption>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Event</th>
            <th scope="col">Book</th>
            <th scope="col">Member</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{formatDateTime(event.at)}</td>
              <td>
                <span className={event.type === 'LEND' ? 'badge badge-lend' : 'badge badge-ok'}>
                  {event.type === 'LEND' ? 'Lent' : 'Returned'}
                </span>
              </td>
              <td>{event.bookTitle}</td>
              <td>
                {event.memberName} <span className="muted">({event.memberId})</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
