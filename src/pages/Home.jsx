export default function Home() {
  return (
    <div className="app">
      <header className="header">
        <h1>Library Desk</h1>
      </header>
      <main className="home-grid">
        <a className="panel home-card" href="/member">
          <h2>Member</h2>
          <p className="muted">Browse the catalogue, see what is available, and borrow a book.</p>
        </a>
        <a className="panel home-card" href="/staff">
          <h2>Staff</h2>
          <p className="muted">See every book, who holds it, each member’s loans, and the history.</p>
        </a>
      </main>
    </div>
  );
}
