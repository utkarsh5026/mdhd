import { useCallback, useEffect, useRef, useState } from 'react';

import { useIsAuthenticated } from '@/services/auth';
import { searchFiles, type SearchResultEntry } from '@/services/search';

/**
 * The return value of {@link useGlobalSearch}, providing controlled access to search state
 * and actions.
 */
interface UseGlobalSearchResult {
  /** The current search query string. */
  query: string;
  /** Updates the search query, triggering a debounced search request. */
  setQuery: (query: string) => void;
  /** The list of file search results returned by the last successful query. */
  results: SearchResultEntry[];
  /** `true` while a search request is in-flight. */
  isLoading: boolean;
  /** Error message from the most recent failed search, or `null` when no error is present. */
  error: string | null;
  /** Clears the query, results, error, and loading state back to their initial values. */
  reset: () => void;
}

/**
 * Provides debounced, cancellation-safe global file search for authenticated users.
 *
 * Watches the query value and fires a search request 300 ms after the user stops typing.
 * Queries shorter than two characters (after trimming) are ignored and clear any previous
 * results immediately. Unauthenticated users receive no results — the hook skips the network
 * call entirely.
 *
 * Concurrent requests are handled via `AbortController`: if a new query arrives before the
 * previous request resolves, the previous request is aborted and its results are discarded.
 *
 * @returns Search state and actions. See {@link UseGlobalSearchResult}.
 *
 * @example
 * ```tsx
 * const { query, setQuery, results, isLoading, error, reset } = useGlobalSearch();
 *
 * return (
 *   <>
 *     <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *     {isLoading && <Spinner />}
 *     {results.map((r) => <SearchResult key={r.id} entry={r} />)}
 *   </>
 * );
 * ```
 */
export function useGlobalSearch(): UseGlobalSearchResult {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useIsAuthenticated();
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2 || !isAuthenticated) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await searchFiles(trimmed);
        if (!controller.signal.aborted) {
          setResults(response.results);
          setError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isAuthenticated]);

  return { query, setQuery, results, isLoading, error, reset };
}
