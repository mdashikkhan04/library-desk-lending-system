import { useCallback, useEffect, useState } from 'react';
import { fetchLoans, isAbort } from '../api.js';
import { withRetry } from '../lib/retry.js';

// Loads the loans of the member being served. Re-fetches (and cancels the old
// request) if the member changes, so one member's loans never show for another.
export function useLoans(memberId) {
  const [loans, setLoans] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    setLoans([]);

    withRetry(() => fetchLoans(memberId, { signal: controller.signal }))
      .then((data) => {
        setLoans(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (isAbort(err)) return;
        setError(err);
        setStatus('error');
      });

    return () => controller.abort();
  }, [memberId, reloadTick]);

  // Add a loan we just created, without waiting for a refetch. Deduped by id.
  const addLoan = useCallback((loan) => {
    setLoans((prev) => (prev.some((l) => l.id === loan.id) ? prev : [...prev, loan]));
  }, []);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  return { loans, status, error, addLoan, reload };
}
