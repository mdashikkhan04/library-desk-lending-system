import { borrowBook } from '../api.js';
import { useIntent } from './useIntent.js';

export const lendIntent = ({ memberId, bookId }) => `lend:${memberId.trim().toLowerCase()}:${bookId}`;

// "Lend this book to the member who typed their id + username."
export function useLend({ onLent, onStale }) {
  return useIntent({
    intentOf: lendIntent,
    send: ({ bookId, memberId, username }, key) => borrowBook(bookId, { memberId, username }, key),
    onSuccess: onLent,
    onStale,
    unknownMessage: "Couldn't confirm the loan. Press Retry. It won't be lent twice.",
  });
}
