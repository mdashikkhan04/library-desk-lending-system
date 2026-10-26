import { useState } from 'react';
import { fetchStaffEvents, fetchStaffMembers } from '../api.js';
import { useCatalogue } from '../hooks/useCatalogue.js';
import { useResource } from '../hooks/useResource.js';
import { useReturn, returnIntent } from '../hooks/useReturn.js';
import Layout from '../components/Layout.jsx';
import CatalogueControls from '../components/CatalogueControls.jsx';
import StaffBooks from '../components/StaffBooks.jsx';
import StaffMembers from '../components/StaffMembers.jsx';
import StaffHistory from '../components/StaffHistory.jsx';

const POLL_MS = 8000;
const TABS = [
  { id: 'books', label: 'Books' },
  { id: 'members', label: 'Members' },
  { id: 'history', label: 'History' },
];

export default function StaffPage() {
  const [tab, setTab] = useState('books');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // All three views read from the library log (through the API) and refresh
  // themselves, so staff also see lends made on the Member screen.
  const catalogue = useCatalogue({ query, status: filter, staff: true });
  const members = useResource(({ signal }) => fetchStaffMembers({ signal }), [], { pollMs: POLL_MS });
  const events = useResource(({ signal }) => fetchStaffEvents({ signal }), [], { pollMs: POLL_MS });

  const refreshAll = () => {
    catalogue.reload({ quiet: true });
    members.reload({ quiet: true });
    events.reload({ quiet: true });
  };

  const { attempt, run } = useReturn({ onReturned: refreshAll, onStale: refreshAll });
  const returns = {
    attempt,
    locked: attempt?.status === 'pending',
    isMine: (loan) => attempt?.intent === returnIntent(loan),
    onReturn: (loan) => run(loan), // loan = { memberId, bookId }
  };

  const counts = { books: catalogue.books.length, members: members.data?.length, history: events.data?.length };

  return (
    <Layout title="Staff desk" subtitle="Staff" current="/staff">
      <div className="tabs tabs-main" role="group" aria-label="Staff views">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? 'tab active' : 'tab'}
            aria-pressed={t.id === tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {counts[t.id] !== undefined && <span className="tab-count">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      <section className="panel">
        {tab === 'books' && (
          <>
            <CatalogueControls query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} />
            <StaffBooks catalogue={catalogue} returns={returns} />
          </>
        )}
        {tab === 'members' && <StaffMembers resource={members} returns={returns} />}
        {tab === 'history' && <StaffHistory resource={events} />}
      </section>
    </Layout>
  );
}
