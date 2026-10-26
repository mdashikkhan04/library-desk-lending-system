// Library rules the desk knows about. The SERVER is the source of truth and
// enforces all of them (409 responses); we mirror them here only so the UI can
// explain *why* a button is disabled instead of letting staff click and fail.
export const MAX_LOANS = 3;

// Returns a human reason why this book can't be lent right now, or null if it can.
export function getBorrowBlock(book, loans) {
  if (loans.some((loan) => loan.bookId === book.id)) return 'Already borrowed by this member';
  if (loans.length >= MAX_LOANS) return `Loan limit reached (${MAX_LOANS})`;
  if (book.copies < 1) return 'None available';
  return null;
}
