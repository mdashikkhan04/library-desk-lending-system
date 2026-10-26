import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbort } from '../api.js';
import { withRetry } from '../lib/retry.js';


export function useResource(load, deps, { pollMs = 0, debounceMs = 0 } = {}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const loadRef = useRef(load);
  loadRef.current = load;
  const quietReload = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const quiet = quietReload.current;
    quietReload.current = false;
    let timer;
    let poller;

    const run = async (silent) => {
      try {
        const result = await withRetry(() => loadRef.current({ signal: controller.signal }));
        setData(result);
        setError(null);
        setStatus('ready');
      } catch (err) {
        if (isAbort(err) || silent) return; // background refresh failures stay quiet
        setError(err);
        setStatus('error');
      }
    };

    const cycle = async (silent) => {
      await run(silent);
      if (pollMs && !controller.signal.aborted) poller = setTimeout(() => cycle(true), pollMs);
    };

    if (!quiet) {
      setStatus('loading');
      setError(null);
    }
    timer = setTimeout(() => cycle(quiet), quiet ? 0 : debounceMs);

    return () => {
      clearTimeout(timer);
      clearTimeout(poller);
      controller.abort();
    };
  }, [...deps, reloadTick, pollMs, debounceMs]);

  // reload(): show "Loading…". reload({ quiet: true }): refresh without any spinner.
  const reload = useCallback(({ quiet = false } = {}) => {
    quietReload.current = quiet;
    setReloadTick((n) => n + 1);
  }, []);

  return { data, status, error, reload };
}
