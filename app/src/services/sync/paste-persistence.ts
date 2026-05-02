import { fileStorageDB, getParentPath } from '@/services/indexeddb/file-db';
import { sha256 } from '@/utils/hash';

/**
 * Reserved path prefix for paste-backed tabs in IndexedDB / server storage.
 * Paste tabs are stored as virtual files under this namespace so they flow
 * through the existing sync pipeline without any special-casing.
 */
export const PASTES_PREFIX = '/__pastes__';

/** Build the IndexedDB path for a paste tab. */
export function pastePathForTab(tabId: string): string {
  return `${PASTES_PREFIX}/${tabId}.md`;
}

/** Check whether a file path belongs to the pastes namespace. */
export function isPastePath(path: string): boolean {
  return path === PASTES_PREFIX || path.startsWith(PASTES_PREFIX + '/');
}

/**
 * Extract the tab ID from a paste path.
 * e.g. `/__pastes__/tab-abc123.md` → `tab-abc123`
 */
export function tabIdFromPastePath(path: string): string | null {
  if (!isPastePath(path)) return null;
  const filename = path.split('/').pop();
  if (!filename) return null;
  return filename.replace(/\.md$/, '');
}

/**
 * Persist a paste tab's content to IndexedDB so the sync pipeline can pick it up.
 * If the file already exists at that path, updates it in place.
 */
export async function savePasteToIndexedDB(
  tabId: string,
  title: string,
  content: string
): Promise<void> {
  const path = pastePathForTab(tabId);
  const existing = await fileStorageDB.getFileByPath(path);
  const contentHash = await sha256(content);

  if (existing) {
    await fileStorageDB.updateFile(existing.id, content);
    await fileStorageDB.updateFileHash(existing.id, contentHash);
  } else {
    await fileStorageDB.addFile({
      name: `${title}.md`,
      path,
      parentPath: getParentPath(path),
      content,
      size: new Blob([content]).size,
      contentHash,
    });
  }
}

/**
 * Delete a paste tab's backing file from IndexedDB.
 */
export async function deletePasteFromIndexedDB(tabId: string): Promise<void> {
  const path = pastePathForTab(tabId);
  const file = await fileStorageDB.getFileByPath(path);
  if (file) {
    await fileStorageDB.deleteFile(file.id);
  }
}

/**
 * Delete a paste from the server (best-effort, fire-and-forget).
 * Only called when the user is authenticated.
 */
export async function deletePasteFromServer(tabId: string): Promise<void> {
  const path = pastePathForTab(tabId);
  const file = await fileStorageDB.getFileByPath(path);
  if (!file) return;

  try {
    const { apiFetch } = await import('@/services/auth/api-client');
    await apiFetch(`/files/${file.id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[paste-persistence] Failed to delete paste from server:', err);
  }
}

/** Fire-and-forget helper for async paste persistence. */
export const persistPaste = (tabId: string, title: string, content: string) => {
  savePasteToIndexedDB(tabId, title, content).catch((err) =>
    console.error('[tabs-store] Failed to persist paste:', err)
  );
};

/** Fire-and-forget: check auth and delete paste from IndexedDB + server. */
export const removePaste = (tabID: string, sourceType: 'paste' | 'file') => {
  if (sourceType !== 'paste') return;
  const isAuthenticated = !!localStorage.getItem('mdhd-auth-token');

  deletePasteFromIndexedDB(tabID).catch((err) =>
    console.error('[tabs-store] Failed to delete paste from IndexedDB:', err)
  );

  if (isAuthenticated) {
    deletePasteFromServer(tabID).catch((err) =>
      console.error('[tabs-store] Failed to delete paste from server:', err)
    );
  }
};
