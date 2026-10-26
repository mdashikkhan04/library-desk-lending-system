import { fetchBooks, fetchStaffBooks } from '../api.js';
import { useResource } from './useResource.js';

const DEBOUNCE_MS = 250;
const POLL_MS = 8000;

export function useCatalogue({ query, status, staff = false }) {
  const { data, status: loadStatus, error, reload } = useResource(
    ({ signal }) => (staff ? fetchStaffBooks : fetchBooks)(query.trim(), { status, signal }),
    [query, status, staff],
    { debounceMs: DEBOUNCE_MS, pollMs: POLL_MS },
  );
  return { books: data ?? [], status: loadStatus, error, reload };
}
