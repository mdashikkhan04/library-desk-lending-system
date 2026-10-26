import { useState } from 'react';
import { useBookSearch } from '../hooks/useBookSearch.js';
import BookCard from './BookCard.jsx';

export default function BookList() {
  const [query, setQuery] = useState('');
  const { books, status, error, reload } = useBookSearch(query);

  return (
    <div>
      <input
        className="search"
        type="search"
        placeholder="Search by title or author"
        aria-label="Search books by title or author"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {status === 'loading' && <p className="muted">Loading…</p>}
      {status === 'error' && (
        <p className="error" role="alert">
          {error.message}{' '}
          <button className="link-btn" onClick={reload}>
            Try again
          </button>
        </p>
      )}
      <ul className="book-list">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </ul>
      {status === 'ready' && books.length === 0 && <p className="muted">No books found.</p>}
    </div>
  );
}
