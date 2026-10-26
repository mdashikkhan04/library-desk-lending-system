import { useEffect, useState } from 'react';
import { fetchMember, isAbort } from './api.js';
import { useLoans } from './hooks/useLoans.js';
import BookList from './components/BookList.jsx';
import MyLoans from './components/MyLoans.jsx';

// The desk is always operated on behalf of one member for now.
const MEMBER_ID = 'm1';

export default function App() {
  const [member, setMember] = useState(null);
  const [memberError, setMemberError] = useState(null);
  const { loans, status, error, reload } = useLoans(MEMBER_ID);

  useEffect(() => {
    const controller = new AbortController();
    fetchMember(MEMBER_ID, { signal: controller.signal })
      .then(setMember)
      .catch((err) => {
        if (!isAbort(err)) setMemberError(err);
      });
    return () => controller.abort();
  }, []);

  const memberLabel = memberError
    ? 'Could not load member'
    : member
      ? `Serving: ${member.name}`
      : 'Loading member…';

  return (
    <div className="app">
      <header className="header">
        <h1>Library Desk</h1>
        <span className="member">{memberLabel}</span>
      </header>
      <main className="layout">
        <section className="panel">
          <h2>Catalogue</h2>
          <BookList />
        </section>
        <aside className="panel">
          <h2>Current loans</h2>
          <MyLoans loans={loans} status={status} error={error} onRetry={reload} />
        </aside>
      </main>
    </div>
  );
}
