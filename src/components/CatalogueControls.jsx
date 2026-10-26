const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
];

// Search box + availability filter, shared by the Member and Staff screens.
export default function CatalogueControls({ query, onQuery, filter, onFilter }) {
  return (
    <div className="controls">
      <input
        className="search"
        type="search"
        placeholder="Search by title or author"
        aria-label="Search books by title or author"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      <div className="tabs" role="group" aria-label="Filter by availability">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={f.value === filter ? 'tab active' : 'tab'}
            aria-pressed={f.value === filter}
            onClick={() => onFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
