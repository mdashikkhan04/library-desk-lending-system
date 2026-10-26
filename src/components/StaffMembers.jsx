import ReturnAction from './ReturnAction.jsx';
import { formatDate } from '../lib/format.js';

// Staff view of the members: who has which books right now.
export default function StaffMembers({ resource, returns }) {
  const { data: members, status, error, reload } = resource;

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
  if (!members) return <p className="muted" role="status">Loading…</p>;

  return (
    <ul className="book-list">
      {members.map((member) => (
        <li key={member.id} className="member-card">
          <div className="book-title">
            {member.name}{' '}
            <span className="muted">
              · ID {member.id} · @{member.username}
            </span>
          </div>
          <div className="muted loan-count">
            {member.loans.length} of {member.maxLoans} books on loan
          </div>
          {member.loans.length === 0 ? (
            <div className="reason muted">No books on loan.</div>
          ) : (
            <ul className="holders" aria-label={`Books held by ${member.name}`}>
              {member.loans.map((loan) => {
                const key = { memberId: member.id, bookId: loan.bookId };
                return (
                  <li key={loan.id} className="holder">
                    <div>
                      <strong>{loan.title}</strong>{' '}
                      <span className="muted">· since {formatDate(loan.borrowedAt)}</span>
                    </div>
                    <ReturnAction
                      title={loan.title}
                      memberName={member.name}
                      attempt={returns.attempt}
                      mine={returns.isMine(key)}
                      locked={returns.locked}
                      onReturn={() => returns.onReturn(key)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
