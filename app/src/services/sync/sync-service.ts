import { apiFetch, apiFetchText } from '@/services/auth';
import { fileStorageDB, getParentPath } from '@/services/indexeddb/file-db';
import { sha256 } from '@/utils/hash';

import { isPastePath, tabIdFromPastePath } from './paste-persistence';
import { loadSyncMeta, setSettingMeta } from './settings-sync-meta';
import { getSyncPreferencesState } from './sync-preferences-store';
import { type SyncableStore, syncableStores } from './syncable-settings';
import type {
  ClientFileEntry,
  ClientSettingEntry,
  CreateFileRequest,
  DownloadedPaste,
  DownloadEntry,
  FetchedFile,
  ResolvedDelete,
  SettingsSyncRequest,
  SettingsSyncResponse,
  SettingsSyncResult,
  SyncRequest,
  SyncResponse,
  SyncResult,
} from './types';

/** Maximum number of file uploads/downloads to process in parallel during a sync. */
const SYNC_BATCH_CONCURRENCY = 4;

/**
 * Runs an async function over an array of items with bounded concurrency.
 *
 * Processes items in sequential windows of `concurrency` size, using
 * `Promise.allSettled` so a single failure does not abort the entire batch.
 *
 * @param items - The items to process.
 * @param concurrency - Maximum number of items to process simultaneously.
 * @param fn - Async function to invoke for each item.
 */
async function batchRun<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.allSettled(items.slice(i, i + concurrency).map(fn));
  }
}

/**
 * Builds the local file manifest to send to the server during sync.
 *
 * Fetches all local files from IndexedDB and computes a SHA-256 content hash for
 * any file that does not already have a cached hash. The resulting manifest is used
 * by the server to determine which files need to be uploaded, downloaded, or deleted.
 *
 * @returns An array of {@link ClientFileEntry} objects representing every locally stored file.
 */
async function buildManifest(): Promise<ClientFileEntry[]> {
  const localFiles = await fileStorageDB.getAllFilesForSync();
  return Promise.all(
    localFiles.map(async (f) => {
      let hash = f.contentHash;
      if (!hash) {
        const full = await fileStorageDB.getFile(f.id);
        hash = full ? await sha256(full.content) : '';
      }
      return {
        path: f.path,
        content_hash: hash,
        updated_at: new Date(f.updatedAt).toISOString(),
      };
    })
  );
}

/**
 * Uploads the specified files to the server.
 *
 * Reads each file from IndexedDB by path and POSTs it to the `/files` endpoint.
 * Files are uploaded in parallel batches up to {@link SYNC_BATCH_CONCURRENCY}.
 * Missing files (no longer in IndexedDB) are silently skipped.
 *
 * @param paths - Local file paths that the server has requested to be uploaded.
 */
async function uploadFiles(paths: string[]): Promise<void> {
  await batchRun(paths, SYNC_BATCH_CONCURRENCY, async (path) => {
    const file = await fileStorageDB.getFileByPath(path);
    if (!file) return;
    const req: CreateFileRequest = { name: file.name, path: file.path, content: file.content };
    await apiFetch('/files', { method: 'POST', body: JSON.stringify(req) });
  });
}

/**
 * Downloads file content for each entry the server indicated should be pulled locally.
 *
 * Fetches raw text content from `/files/{id}/content`, computes its SHA-256 hash,
 * and checks IndexedDB for an existing record at the same path so that
 * {@link applyDownloads} can decide whether to insert or update.
 *
 * @param entries - Files the server has indicated need to be downloaded.
 * @returns Fetched file data including content, hash, and any existing local ID.
 */
async function fetchDownloads(entries: DownloadEntry[]): Promise<FetchedFile[]> {
  const results: FetchedFile[] = [];

  await batchRun(entries, SYNC_BATCH_CONCURRENCY, async (entry) => {
    const content = await apiFetchText(`/files/${entry.id}/content`);
    const hash = await sha256(content);
    const existing = await fileStorageDB.getFileByPath(entry.path);
    results.push({ entry, content, hash, existingId: existing?.id ?? null });
  });

  return results;
}

/**
 * Persists downloaded files to IndexedDB and returns any paste-tab updates.
 *
 * Splits the fetched files into updates (existing local record) and adds (new
 * records), then calls a single `batchUpsertFiles`. After persisting, identifies
 * files whose paths correspond to paste tabs so callers can refresh those tabs.
 *
 * @param fetched - Files previously downloaded via {@link fetchDownloads}.
 * @returns Paste entries whose tab content should be refreshed in the UI.
 */
async function applyDownloads(fetched: FetchedFile[]): Promise<DownloadedPaste[]> {
  const updates = fetched
    .filter((f) => f.existingId !== null)
    .map((f) => ({ id: f.existingId!, content: f.content, contentHash: f.hash }));

  const adds = fetched
    .filter((f) => f.existingId === null)
    .map((f) => ({
      name: f.entry.name,
      path: f.entry.path,
      parentPath: getParentPath(f.entry.path),
      content: f.content,
      size: new Blob([f.content]).size,
      contentHash: f.hash,
    }));

  await fileStorageDB.batchUpsertFiles(updates, adds);

  return fetched.flatMap(({ entry, content }) => {
    const tabId = isPastePath(entry.path) ? tabIdFromPastePath(entry.path) : null;
    return tabId ? [{ tabId, title: entry.name.replace(/\.md$/, ''), content }] : [];
  });
}

/**
 * Resolves file paths scheduled for deletion to their local IndexedDB IDs.
 *
 * Looks up each path in IndexedDB and returns only those that still exist locally,
 * so that {@link applyDeletes} can remove them by ID.
 *
 * @param paths - File paths the server has indicated should be deleted locally.
 * @returns Resolved path-to-ID pairs for files that exist in IndexedDB.
 */
async function resolveDeletes(paths: string[]): Promise<ResolvedDelete[]> {
  const resolved: ResolvedDelete[] = [];

  await batchRun(paths, SYNC_BATCH_CONCURRENCY, async (path) => {
    const file = await fileStorageDB.getFileByPath(path);
    if (file) resolved.push({ id: file.id, path });
  });

  return resolved;
}

/**
 * Deletes the resolved files from IndexedDB and returns affected paste tab IDs.
 *
 * @param resolved - Files to delete, as resolved by {@link resolveDeletes}.
 * @returns Tab IDs of any paste tabs that were backed by a deleted file, so the
 *   caller can close or invalidate those tabs in the UI.
 */
async function applyDeletes(resolved: ResolvedDelete[]): Promise<string[]> {
  await fileStorageDB.batchDeleteFiles(resolved.map((r) => r.id));

  return resolved.flatMap(({ path }) => {
    const tabId = isPastePath(path) ? tabIdFromPastePath(path) : null;
    return tabId ? [tabId] : [];
  });
}

/**
 * Performs a full bidirectional file sync against the server.
 *
 * Sends the local file manifest to `/sync`, then processes the server's
 * response by uploading, downloading, and deleting files as instructed.
 * The result includes counts for each operation plus any paste-tab side effects
 * that the caller (e.g. a UI sync hook) should apply.
 *
 * @param lastSyncAt - ISO timestamp of the most recent successful sync, or `null`
 *   on the first sync. Passed to the server to limit the diff window.
 * @returns A {@link SyncResult} summarizing upload/download/delete counts and any
 *   paste tab data that changed as a result of the sync.
 *
 * @throws {AppError} When the server returns a non-OK response.
 *
 * @example
 * const result = await performSync(lastSyncAt);
 * console.log(`↑${result.uploaded} ↓${result.downloaded} ✕${result.deleted}`);
 */
export async function performSync(lastSyncAt: string | null): Promise<SyncResult> {
  const manifest = await buildManifest();

  const result = await apiFetch<SyncResponse>('/sync', {
    method: 'POST',
    body: JSON.stringify({ files: manifest, last_sync_at: lastSyncAt } satisfies SyncRequest),
  });

  await uploadFiles(result.to_upload);

  const fetched = await fetchDownloads(result.to_download);
  const downloadedPastes = await applyDownloads(fetched);

  const resolved = await resolveDeletes(result.to_delete);
  const deletedPasteTabIds = await applyDeletes(resolved);

  return {
    uploaded: result.to_upload.length,
    downloaded: result.to_download.length,
    deleted: result.to_delete.length,
    serverTime: result.server_time,
    downloadedPastes,
    deletedPasteTabIds,
  };
}

/**
 * Builds the settings payload to send during a settings sync round trip.
 *
 * For each store, reads the current value, hashes it, and compares against the
 * last-known meta. If the hash matches (value unchanged), the previous
 * `updated_at` timestamp is reused so the server can correctly resolve conflicts
 * without treating an unchanged local value as newer than the server's copy.
 *
 * @param stores - The syncable setting stores to include in the payload.
 * @param meta - Last-known sync metadata keyed by setting key.
 * @param now - ISO timestamp representing the current moment, used as `updated_at`
 *   for settings whose value has changed since the last sync.
 * @returns Setting entries ready to send in a {@link SettingsSyncRequest}.
 */
async function buildSettingEntries(
  stores: SyncableStore[],
  meta: ReturnType<typeof loadSyncMeta>,
  now: string
): Promise<ClientSettingEntry[]> {
  const results = await Promise.all(
    stores.map(async (store) => {
      const value = store.read();
      if (!value) return null;
      const hash = await sha256(JSON.stringify(value));
      const prev = meta[store.key];
      const updatedAt = prev?.hash === hash ? prev.updated_at : now;
      return { key: store.key, hash, updated_at: updatedAt, value } satisfies ClientSettingEntry;
    })
  );
  return results.filter((e): e is ClientSettingEntry => e !== null);
}

/**
 * Performs a bidirectional settings sync in a single round trip.
 *
 * Reads all enabled syncable stores (respecting the user's disabled-keys preference),
 * builds a settings payload via {@link buildSettingEntries}, and POSTs it to
 * `/settings/sync`. The server responds with which keys it accepted (our value won)
 * and which keys were updated (server value was newer). Local stores and sync meta
 * are updated accordingly.
 *
 * Settings whose key appears in the user's `disabledKeys` preference are excluded
 * from the sync entirely — neither pushed nor pulled.
 *
 * @returns Push/pull counts indicating how many settings were sent to and received
 *   from the server.
 *
 * @throws {AppError} When the server returns a non-OK response.
 */
export async function performSettingsSync(): Promise<SettingsSyncResult> {
  const meta = loadSyncMeta();
  const now = new Date().toISOString();

  const { disabledKeys } = getSyncPreferencesState();
  const enabledStores = syncableStores.filter((s) => !disabledKeys.includes(s.key));

  const entries = await buildSettingEntries(enabledStores, meta, now);

  if (entries.length === 0) return { pushed: 0, pulled: 0 };

  const body: SettingsSyncRequest = { settings: entries };
  const result = await apiFetch<SettingsSyncResponse>('/settings/sync', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  for (const entry of result.updated) {
    const store = enabledStores.find((s) => s.key === entry.key);
    if (store) {
      store.write(entry.value);
      setSettingMeta(entry.key, entry.hash, entry.updated_at);
    }
  }

  // Update meta for accepted entries (server took our value)
  for (const key of result.accepted) {
    const sent = entries.find((e) => e.key === key);
    if (sent) {
      setSettingMeta(key, sent.hash, result.server_time);
    }
  }

  // Also update meta for entries that were already in sync (not in updated or accepted)
  for (const entry of entries) {
    if (!result.accepted.includes(entry.key) && !result.updated.some((u) => u.key === entry.key)) {
      setSettingMeta(entry.key, entry.hash, entry.updated_at);
    }
  }

  return {
    pushed: result.accepted.length,
    pulled: result.updated.length,
  };
}
