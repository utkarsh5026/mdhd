import { fileStorageDB } from '@/services/indexeddb/file-db';
import type { StoredFile } from '@/services/indexeddb/types';
import { sha256 } from '@/utils/hash';
import { deriveNameFromMarkdown, generateRandomName } from '@/utils/name-generator';

const ROOT = '/';
const MAX_NAME_ATTEMPTS = 20;

/**
 * Pick a unique root-level filename. Tries `${base}.md`, `${base}-2.md`, …
 * If `base` collides repeatedly, falls back to fresh random names.
 */
async function uniqueRootPath(base: string): Promise<{ name: string; path: string }> {
  const tryName = async (candidate: string) => {
    const name = `${candidate}.md`;
    const path = `${ROOT}${name}`;
    const existing = await fileStorageDB.getFileByPath(path);
    return existing ? null : { name, path };
  };

  const first = await tryName(base);
  if (first) return first;

  for (let i = 2; i <= 9; i++) {
    const found = await tryName(`${base}-${i}`);
    if (found) return found;
  }

  for (let i = 0; i < MAX_NAME_ATTEMPTS; i++) {
    const found = await tryName(generateRandomName());
    if (found) return found;
  }

  throw new Error('Could not allocate a unique filename after many attempts');
}

/**
 * Persist pasted content as a regular file at the root of the user's library.
 * The filename is derived from the first H1 (or H2) heading in the content,
 * slugified for safety; falls back to a Railway-style random pair when no
 * usable heading is present. Collisions are deduped with `-2`, `-3`, … and
 * ultimately by re-rolling a fresh random name.
 */
export async function savePastedContent(content: string): Promise<StoredFile> {
  const baseName = deriveNameFromMarkdown(content) ?? generateRandomName();
  const { name, path } = await uniqueRootPath(baseName);
  const contentHash = await sha256(content);

  const file = await fileStorageDB.addFile({
    name,
    path,
    parentPath: ROOT,
    content,
    size: new Blob([content]).size,
    contentHash,
  });

  if (!file) {
    throw new Error(`Failed to save pasted content: path collision at ${path}`);
  }
  return file;
}

/**
 * Update the content of a previously-saved pasted file.
 * No-op if the file no longer exists in IndexedDB.
 */
export async function updateSavedContent(fileId: string, content: string): Promise<void> {
  const contentHash = await sha256(content);
  await fileStorageDB.updateFile(fileId, content);
  await fileStorageDB.updateFileHash(fileId, contentHash);
}
