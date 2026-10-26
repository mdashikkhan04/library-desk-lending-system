const LINKS = [
  { href: '/member', label: 'Member' },
  { href: '/staff', label: 'Staff' },
];

export default function Layout({ title, subtitle, current, children }) {
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>
            <a className="home-link" href="/">
              Library Desk
            </a>
          </h1>
          {subtitle && <span className="muted">{subtitle}</span>}
        </div>
        <nav aria-label="Switch screen" className="nav">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={link.href === current ? 'nav-link active' : 'nav-link'}
              aria-current={link.href === current ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <h2 className="page-title">{title}</h2>
        {children}
      </main>
    </div>
  );
}
