import { useCallback, useEffect, useState } from 'react';
import { fetchBooks, isAbort } from '../api.js';
import { withRetry } from '../lib/retry.js';

const DEBOUNCE_MS = 250;

// Searches the catalogue as the user types.
//  - debounce: don't fire a request for every keystroke
//  - abort:    when the query changes, the previous request is cancelled so a
//              slow, stale response can never overwrite a newer one
//              (the API is SLOWER for short queries, so "d" would arrive after "dune")
export function useBookSearch(query) {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    const timer = setTimeout(() => {
      withRetry(() => fetchBooks(query.trim(), { signal: controller.signal }))
        .then((data) => {
          setBooks(data);
          setStatus('ready');
        })
        .catch((err) => {
          if (isAbort(err)) return; // superseded by a newer query: ignore
          setError(err);
          setStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, reloadTick]);

  // Replace one book with the fresh copy the server returned (new `copies`).
  const patchBook = useCallback((book) => {
    setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)));
  }, []);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  return { books, status, error, patchBook, reload };
}
