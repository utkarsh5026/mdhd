import { useEffect, useMemo, useState } from 'react';

import type { FileSearchHit } from '@/components/features/content-reading/hooks/use-all-files-search';
import { useAllFilesSearch } from '@/components/features/content-reading/hooks/use-all-files-search';
import { useRecentFiles } from '@/components/features/file-explorer/store/file-store';
import { fuzzyRank } from '@/services/search/fuzzy';
import { listLocalFiles, type LocalFileEntry } from '@/services/search/local-search';

/** A row in the palette. Files match on name/path, content rows on body text. */
export type PaletteItem =
  | {
      kind: 'file';
      key: string;
      fileId: string;
      name: string;
      path: string;
      /** Indices in `path` that matched the query, for highlighting. */
      positions: number[];
      /** True when surfaced because it was opened recently, not because it matched. */
      isRecent: boolean;
    }
  | { kind: 'content'; key: string; hit: FileSearchHit };

/** Files listed before the user types anything. */
const IDLE_FILE_LIMIT = 8;
/** Files listed once a query narrows things down. */
const MATCHED_FILE_LIMIT = 12;

interface PaletteItems {
  items: PaletteItem[];
  /** Index at which content matches begin, for the section heading. */
  contentStart: number;
  isLoadingContent: boolean;
}

/**
 * Assembles palette rows: file-name matches first, then in-document content
 * matches.
 *
 * Name matching runs synchronously against a list loaded once per open, so
 * typing filters instantly; content search is debounced and asynchronous
 * because it has to scan document bodies.
 *
 * @param query - Current palette input.
 * @param isOpen - Whether the palette is mounted and should hold a file list.
 */
export function usePaletteItems(query: string, isOpen: boolean): PaletteItems {
  const [files, setFiles] = useState<LocalFileEntry[]>([]);
  const recentFiles = useRecentFiles();
  const contentSearch = useAllFilesSearch();
  const { setQuery: setContentQuery, reset: resetContentSearch } = contentSearch;

  // Refresh the file list on each open — documents may have been added or
  // renamed since the palette was last shown.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    listLocalFiles().then((loaded) => {
      if (!cancelled) setFiles(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setContentQuery(query);
    else resetContentSearch();
  }, [query, isOpen, setContentQuery, resetContentSearch]);

  const trimmed = query.trim();

  const fileItems = useMemo<PaletteItem[]>(() => {
    if (!trimmed) {
      // Recents first, then anything else, so an empty palette is still useful.
      const recentIds = new Set(recentFiles.map((f) => f.id));
      const recents: PaletteItem[] = recentFiles.map((file) => ({
        kind: 'file',
        key: `file:${file.id}`,
        fileId: file.id,
        name: file.name,
        path: file.path,
        positions: [],
        isRecent: true,
      }));

      const rest: PaletteItem[] = files
        .filter((file) => !recentIds.has(file.id))
        .slice(0, Math.max(0, IDLE_FILE_LIMIT - recents.length))
        .map((file) => ({
          kind: 'file',
          key: `file:${file.id}`,
          fileId: file.id,
          name: file.name,
          path: file.path,
          positions: [],
          isRecent: false,
        }));

      return [...recents, ...rest];
    }

    return fuzzyRank(trimmed, files, (file) => file.path, MATCHED_FILE_LIMIT).map(
      ({ item, match }) => ({
        kind: 'file',
        key: `file:${item.id}`,
        fileId: item.id,
        name: item.name,
        path: item.path,
        positions: match.positions,
        isRecent: false,
      })
    );
  }, [trimmed, files, recentFiles]);

  const contentItems = useMemo<PaletteItem[]>(() => {
    if (!trimmed) return [];

    // A document already listed by name adds nothing as a content row.
    const listed = new Set(
      fileItems.filter((item) => item.kind === 'file').map((item) => item.fileId)
    );

    return contentSearch.results
      .filter((hit) => !listed.has(hit.fileId))
      .map((hit) => ({ kind: 'content', key: `content:${hit.fileId}`, hit }));
  }, [trimmed, contentSearch.results, fileItems]);

  return {
    items: [...fileItems, ...contentItems],
    contentStart: fileItems.length,
    isLoadingContent: contentSearch.isLoading,
  };
}
