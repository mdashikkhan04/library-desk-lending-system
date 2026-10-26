import { returnBook } from '../api.js';
import { useIntent } from './useIntent.js';

export const returnIntent = ({ memberId, bookId }) => `return:${memberId}:${bookId}`;

// "Take this book back from this member" (staff action).
export function useReturn({ onReturned, onStale }) {
  return useIntent({
    intentOf: returnIntent,
    send: ({ bookId, memberId }, key) => returnBook(bookId, { memberId }, key),
    onSuccess: onReturned,
    onStale,
    unknownMessage: "Couldn't confirm the return. Press Retry. It won't be returned twice.",
  });
}
