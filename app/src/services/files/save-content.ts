import { fileStorageDB } from '@/services/indexeddb/file-db';
import type { StoredFile } from '@/services/indexeddb/types';
import { sha256 } from '@/utils/hash';
import { deriveNameFromMarkdown, generateRandomName } from '@/utils/name-generator';

const ROOT = '/';
const MAX_NAME_ATTEMPTS = 20;
const DEFAULT_EXTENSION = '.md';

/**
 * Splits a filename into its base and extension (`main.rs.md` → `['main.rs', '.md']`).
 *
 * A dotfile has no extension to split off (`.env` → `['.env', '']`), so the
 * leading dot stays part of the base.
 */
function splitExtension(filename: string): [base: string, extension: string] {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return [filename, ''];
  return [filename.slice(0, dot), filename.slice(dot)];
}

/**
 * Reduces an incoming filename to a single path segment.
 *
 * Names reaching {@link saveDocument} come from a dropped `File`, so they are
 * normally bare — but a name carrying separators would otherwise be stored as a
 * path and land the document in an unexpected (or non-existent) directory.
 */
function toBareFilename(filename: string): string {
  return filename.split(/[\\/]/).pop() ?? '';
}

/**
 * Pick a unique root-level filename. Tries `${base}${ext}`, `${base}-2${ext}`, …
 * If `base` collides repeatedly, falls back to fresh random names.
 */
async function uniqueRootPath(
  base: string,
  extension: string = DEFAULT_EXTENSION
): Promise<{ name: string; path: string }> {
  const tryName = async (candidate: string) => {
    const name = `${candidate}${extension}`;
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
 * Persist content as a regular file at the root of the user's library.
 *
 * Every document a reader opens goes through here, because a tab that is not
 * file-backed cannot survive a reload: the persisted tab state deliberately
 * strips `content` to stay inside the localStorage quota, and rehydration
 * reloads it from IndexedDB by `sourceFileId`.
 *
 * `filename` is the name the document arrived under — an imported
 * `Q3 Report.md` is stored under that name so it is recognisable in the file
 * explorer, keeping whatever extension the importer settled on. Typed or pasted
 * text has no filename, so the name is derived from the first H1 (or H2)
 * heading, slugified for safety, falling back to a Railway-style random pair
 * when no usable heading is present. Collisions are deduped with `-2`, `-3`, …
 * and ultimately by re-rolling a fresh random name.
 */
export async function saveDocument(content: string, filename?: string): Promise<StoredFile> {
  const [importedBase, importedExtension] = splitExtension(toBareFilename(filename ?? ''));

  const base = importedBase || deriveNameFromMarkdown(content) || generateRandomName();
  const extension = importedExtension || DEFAULT_EXTENSION;

  const { name, path } = await uniqueRootPath(base, extension);
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
    throw new Error(`Failed to save document: path collision at ${path}`);
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
