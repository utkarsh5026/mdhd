import { useCallback, useEffect, useRef, useState } from 'react';

import { useIsAuthenticated } from '@/services/auth';
import { searchFiles } from '@/services/search';
import { searchLocalFiles } from '@/services/search/local-search';
import type { Snippet } from '@/services/search/snippet';

/** One document matching a cross-file query, from either search backend. */
export interface FileSearchHit {
  fileId: string;
  fileName: string;
  filePath: string;
  /** Where the hit came from — local hits render a plain snippet, server hits HTML. */
  source: 'local' | 'server';
  /** Plain-text excerpt with highlight offsets. Local hits only. */
  excerpt?: Snippet;
  /** Server-rendered headline containing `<mark>` tags. Server hits only. */
  headline?: string;
  /** Occurrences within the document. Local hits only. */
  matchCount?: number;
}

interface UseAllFilesSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: FileSearchHit[];
  isLoading: boolean;
  error: string | null;
  /** True when results came from the server rather than the local index. */
  isRemote: boolean;
  reset: () => void;
}

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

/**
 * Cross-file search that works offline.
 *
 * Queries the local IndexedDB index first — it is always available, needs no
 * account, and returns without a network round-trip. Only when the local index
 * has nothing and the user is signed in does it fall back to the server, which
 * can still know about documents that have not been pulled to this device.
 *
 * Replaces the previous server-only path, which returned nothing at all for
 * signed-out or offline users.
 */
export function useAllFilesSearch(): UseAllFilesSearchResult {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileSearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemote, setIsRemote] = useState(false);
  const isAuthenticated = useIsAuthenticated();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Incremented per search so stale async results can be discarded. */
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
    setIsRemote(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      runIdRef.current++;
      setResults([]);
      setError(null);
      setIsLoading(false);
      setIsRemote(false);
      return;
    }

    setIsLoading(true);
    const runId = ++runIdRef.current;
    const isCurrent = () => runIdRef.current === runId;

    debounceRef.current = setTimeout(async () => {
      try {
        const local = await searchLocalFiles(trimmed);
        if (!isCurrent()) return;

        if (local.length > 0) {
          setResults(
            local.map((hit) => ({
              fileId: hit.fileId,
              fileName: hit.fileName,
              filePath: hit.filePath,
              source: 'local' as const,
              matchCount: hit.matchCount,
              excerpt: {
                snippet: hit.snippet,
                matchStart: hit.matchStart,
                matchLength: hit.matchLength,
              },
            }))
          );
          setIsRemote(false);
          setError(null);
          return;
        }

        // Nothing stored locally matches. The server may still have documents
        // this device has never downloaded.
        if (!isAuthenticated || !navigator.onLine) {
          setResults([]);
          setIsRemote(false);
          setError(null);
          return;
        }

        const response = await searchFiles(trimmed);
        if (!isCurrent()) return;

        setResults(
          response.results.map((entry) => ({
            fileId: entry.file_id,
            fileName: entry.file_name,
            filePath: entry.file_path,
            source: 'server' as const,
            headline: entry.headline,
          }))
        );
        setIsRemote(true);
        setError(null);
      } catch (err) {
        if (!isCurrent()) return;
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        if (isCurrent()) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isAuthenticated]);

  return { query, setQuery, results, isLoading, error, isRemote, reset };
}
