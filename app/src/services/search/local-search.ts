/**
 * Offline full-text search across every document in IndexedDB.
 *
 * The server-backed `/files/search` endpoint only answers for authenticated
 * users, which left cross-file search unavailable offline — against the rule
 * that no frontend feature hard-depends on the server. This is the local
 * equivalent: an in-memory index rebuilt incrementally from IndexedDB.
 *
 * Documents are indexed through `toSearchableText`, so code inside fenced
 * blocks is searchable alongside prose.
 */

import { fileStorageDB } from '@/services/indexeddb';
import { toSearchableText } from '@/services/section/parsing';

import { buildSnippet, type Snippet } from './snippet';

/** One document matching a query. */
export interface LocalSearchHit extends Snippet {
  fileId: string;
  fileName: string;
  filePath: string;
  /** Total occurrences in this document; the snippet shows the first. */
  matchCount: number;
}

interface IndexEntry {
  id: string;
  name: string;
  path: string;
  /** Changes whenever the file's content does, driving re-indexing. */
  stamp: string;
  text: string;
  lowerText: string;
}

/** Default cap on documents returned by a single query. */
const DEFAULT_LIMIT = 30;

/**
 * How long a refresh is considered current. Queries are debounced upstream, so
 * this only suppresses the metadata round-trip for bursts of near-simultaneous
 * calls (the palette querying names and content at once, for instance).
 */
const REFRESH_TTL_MS = 2_000;

const index = new Map<string, IndexEntry>();
let lastRefresh = 0;
let inFlight: Promise<void> | null = null;

/**
 * Drops the cached index so the next query rebuilds from scratch.
 *
 * Only needed when IndexedDB is modified behind this module's back — a full
 * wipe, or a sync that replaces content without touching `updatedAt`. Ordinary
 * edits are picked up automatically by the stamp comparison.
 */
export function invalidateLocalSearchIndex(): void {
  index.clear();
  lastRefresh = 0;
}

/**
 * Brings the index in line with IndexedDB.
 *
 * Reads the cheap metadata listing first and only fetches content for
 * documents whose stamp changed, so steady-state refreshes cost one cursor
 * pass regardless of how much text is stored.
 */
async function refreshIndex(): Promise<void> {
  if (Date.now() - lastRefresh < REFRESH_TTL_MS) return;
  // Collapse concurrent callers onto one rebuild.
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const metadata = await fileStorageDB.getAllFilesForSync();
    const seen = new Set<string>();

    for (const meta of metadata) {
      seen.add(meta.id);
      const stamp = meta.contentHash ?? String(meta.updatedAt);
      const cached = index.get(meta.id);

      if (cached && cached.stamp === stamp) {
        // A rename leaves content untouched; keep the text, refresh the labels.
        cached.name = meta.name;
        cached.path = meta.path;
        continue;
      }

      const file = await fileStorageDB.getFile(meta.id);
      if (!file) continue;

      const text = toSearchableText(file.content);
      index.set(meta.id, {
        id: meta.id,
        name: meta.name,
        path: meta.path,
        stamp,
        text,
        lowerText: text.toLowerCase(),
      });
    }

    for (const id of index.keys()) {
      if (!seen.has(id)) index.delete(id);
    }

    lastRefresh = Date.now();
  })();

  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

/**
 * Searches every stored document for `query`.
 *
 * @param query - Case-insensitive substring to look for. Queries shorter than
 *   two characters return nothing, matching the in-document search threshold.
 * @param limit - Maximum documents to return. Defaults to 30.
 * @returns Matching documents, most matches first, then alphabetically by path.
 */
export async function searchLocalFiles(
  query: string,
  limit = DEFAULT_LIMIT
): Promise<LocalSearchHit[]> {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  await refreshIndex();

  const hits: LocalSearchHit[] = [];

  for (const entry of index.values()) {
    const first = entry.lowerText.indexOf(needle);
    if (first === -1) continue;

    let matchCount = 0;
    for (let at = first; at !== -1; at = entry.lowerText.indexOf(needle, at + needle.length)) {
      matchCount++;
    }

    hits.push({
      fileId: entry.id,
      fileName: entry.name,
      filePath: entry.path,
      matchCount,
      ...buildSnippet(entry.text, first, needle.length),
    });
  }

  hits.sort((a, b) => b.matchCount - a.matchCount || a.filePath.localeCompare(b.filePath));
  return hits.slice(0, limit);
}

/** Lightweight descriptor of an indexed document, for name-based quick-open. */
export interface LocalFileEntry {
  id: string;
  name: string;
  path: string;
}

/**
 * Lists every stored document, for quick-open style filtering by name.
 *
 * @returns Documents sorted by path.
 */
export async function listLocalFiles(): Promise<LocalFileEntry[]> {
  await refreshIndex();

  return Array.from(index.values(), ({ id, name, path }) => ({ id, name, path })).sort((a, b) =>
    a.path.localeCompare(b.path)
  );
}
