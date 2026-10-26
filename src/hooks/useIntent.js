import { useCallback, useRef, useState } from 'react';
import { withRetry } from '../lib/retry.js';

const KEY_TTL_MS = 2 * 60 * 1000;

const newKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function useIntent(config) {
  const [attempt, setAttempt] = useState(null);

  const latest = useRef(config);
  latest.current = config;

  const pendingKeys = useRef(new Map());

  const busy = useRef(false);

  const run = useCallback(async (args) => {
    if (busy.current) return false;
    busy.current = true;

    const { intentOf, send, onSuccess, onStale, unknownMessage } = latest.current;
    const intent = intentOf(args);
    const saved = pendingKeys.current.get(intent);
    const key = saved && Date.now() - saved.at < KEY_TTL_MS ? saved.key : newKey();
    pendingKeys.current.set(intent, { key, at: saved?.key === key ? saved.at : Date.now() });
    setAttempt({ intent, status: 'pending' });

    try {
      const result = await withRetry(() => send(args, key));
      pendingKeys.current.delete(intent);
      setAttempt(null);
      onSuccess?.(result, args);
      return true;
    } catch (err) {
      if (err.retryable) {
        setAttempt({ intent, status: 'error', canRetry: true, message: unknownMessage });
        onStale?.();
      } else {
        pendingKeys.current.delete(intent);
        setAttempt({ intent, status: 'error', canRetry: false, message: err.message });
        if (err.status === 409) onStale?.(); // our screen was out of date
      }
      return false;
    } finally {
      busy.current = false;
    }
  }, []);

  const clear = useCallback(() => setAttempt((a) => (a?.status === 'pending' ? a : null)), []);

  return { attempt, run, clear };
}
