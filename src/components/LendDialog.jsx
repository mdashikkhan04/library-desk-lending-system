import { useEffect, useRef, useState } from 'react';

// Asks for the member's id + username, then lends `book` to that member.
// `attempt` is the state of the lend request (pending / error / null).
export default function LendDialog({ book, attempt, onSubmit, onClose, onEdit }) {
  const dialogRef = useRef(null);
  const [memberId, setMemberId] = useState('');
  const [username, setUsername] = useState('');

  const pending = attempt?.status === 'pending';
  const failed = attempt?.status === 'error';

  // A native <dialog> gives focus handling, Escape and a backdrop for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  const edit = (setter) => (e) => {
    setter(e.target.value);
    onEdit(); // an old error no longer describes what is typed now
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ memberId: memberId.trim(), username: username.trim() });
  };

  let label = 'Lend book';
  if (pending) label = 'Lending…';
  else if (failed && attempt.canRetry) label = 'Retry';

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="lend-title"
      onCancel={(e) => {
        e.preventDefault(); // Escape: close through our own handler
        if (!pending) onClose();
      }}
    >
      <form onSubmit={submit}>
        <h2 id="lend-title">Lend “{book.title}”</h2>
        <p className="muted">Enter the member who is borrowing this book.</p>

        <label className="field">
          <span>Member ID</span>
          <input
            value={memberId}
            onChange={edit(setMemberId)}
            placeholder="e.g. m1"
            autoComplete="off"
            required
            disabled={pending}
            autoFocus
          />
        </label>
        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={edit(setUsername)}
            placeholder="e.g. alex"
            autoComplete="off"
            required
            disabled={pending}
          />
        </label>

        {failed && (
          <p className="error" role="alert">
            {attempt.message}
          </p>
        )}

        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={pending || !memberId.trim() || !username.trim()}>
            {label}
          </button>
        </div>
      </form>
    </dialog>
  );
}
