import { useCallback, useRef, useState } from 'react';
import { borrowBook } from '../api.js';
import { withRetry } from '../lib/retry.js';

// Owns the "lend this book" action for one member.
//
// Why it is more than a single fetch: the API is flaky on writes.
//   503 -> failed BEFORE doing anything (safe to try again)
//   504 -> the loan WAS created but the answer got lost (trying again with a
//          fresh request would create a duplicate / a confusing 409)
// We can't tell those apart from the client, so every attempt for the same
// intent carries the SAME Idempotency-Key. The server then replays the
// original result instead of lending twice.
export function useBorrow({ memberId, onBorrowed, onStale }) {
  // The one attempt we show in the UI:
  // { bookId, status: 'pending' | 'error', message?, canRetry? } or null.
  const [attempt, setAttempt] = useState(null);

  // Keys of intents whose outcome is still unknown. Kept so a manual "Retry"
  // click re-sends the SAME key. Dropped once we get a definitive answer.
  const pendingKeys = useRef(new Map());

  // A ref (not state) because it must flip synchronously: two fast clicks can
  // both run before React re-renders and disables the button.
  const busy = useRef(false);

  const borrow = useCallback(
    async (bookId) => {
      if (busy.current) return;
      busy.current = true;

      const intent = `${memberId}:${bookId}`;
      const key = pendingKeys.current.get(intent) ?? crypto.randomUUID();
      pendingKeys.current.set(intent, key);
      setAttempt({ bookId, status: 'pending' });

      try {
        const result = await withRetry(() => borrowBook(bookId, memberId, key));
        pendingKeys.current.delete(intent);
        setAttempt(null);
        onBorrowed(result); // { loan, book }
      } catch (err) {
        if (err.retryable) {
          // Outcome unknown. Keep the key so Retry is safe.
          setAttempt({
            bookId,
            status: 'error',
            canRetry: true,
            message: "Couldn't confirm the loan. Press Retry. It won't be lent twice.",
          });
        } else {
          // Definitive refusal (409 rule, 404...). A new click is a new intent.
          pendingKeys.current.delete(intent);
          setAttempt({ bookId, status: 'error', canRetry: false, message: err.message });
          // Our screen was out of date (e.g. someone took the last copy).
          if (err.status === 409) onStale?.();
        }
      } finally {
        busy.current = false;
      }
    },
    [memberId, onBorrowed, onStale],
  );

  return { attempt, borrow };
}
