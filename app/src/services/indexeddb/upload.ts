import { toast } from 'sonner';

import { sha256 } from '@/utils/hash';

import { fileStorageDB, getParentPath, normalizePath } from './file-db';
import type { StoredDirectory, StoredFile, UploadProgressCallback } from './types';

/** Maximum allowed file size for a single upload (10 MB). Files exceeding this are skipped with a warning toast. */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Maximum directory nesting depth traversed during a drag-drop operation. Subtrees beyond this level are skipped. */
const MAX_DIRECTORY_DEPTH = 10;

/** Maximum number of files collected from a single drag-drop. Files beyond this limit are skipped with a warning toast. */
const MAX_FILE_COUNT = 1000;

/**
 * Filters a list of `File` objects to only those with a `.md` or `.markdown` extension.
 *
 * @param files - The raw file list to filter.
 * @returns A new array containing only markdown files.
 */
function filterMarkdownFiles(files: File[]): File[] {
  return files.filter(({ name }) => {
    const filename = name.toLowerCase();
    return filename.endsWith('.md') || filename.endsWith('.markdown');
  });
}

/**
 * Derives the unique set of ancestor directory paths implied by a list of file paths.
 *
 * Walks every segment of each path upward to the root so that all intermediate
 * directories are represented. The result is sorted shortest-first so callers
 * can safely create parent directories before their children.
 *
 * @param filePaths - Absolute file paths to inspect (will be normalized).
 * @returns Deduplicated directory paths sorted by ascending length.
 */
function extractDirectoryPaths(filePaths: string[]): string[] {
  const dirs = new Set<string>();

  for (const filePath of filePaths) {
    const normalized = normalizePath(filePath);
    let current = getParentPath(normalized);

    while (current !== '/') {
      dirs.add(current);
      current = getParentPath(current);
    }
  }

  return Array.from(dirs).sort((a, b) => a.length - b.length);
}

/**
 * Resolves the storage path for a `File`, preferring `webkitRelativePath` over
 * the bare filename so that directory uploads preserve their folder structure.
 *
 * @param file - The browser `File` object.
 * @param basePath - Optional prefix to prepend before the resolved name.
 * @returns A normalized absolute path (always starts with `/`).
 */
function getFilePath(file: File, basePath: string = ''): string {
  return normalizePath(basePath + '/' + (file.webkitRelativePath || file.name));
}

/**
 * Reads, hashes, and persists a list of files to IndexedDB in parallel batches.
 *
 * Non-markdown files are silently ignored. Files exceeding `MAX_FILE_SIZE` are
 * skipped with a warning toast. Each batch of up to 10 files is processed with
 * `Promise.allSettled` so a single failure doesn't abort the rest.
 *
 * @async
 * @param files - The browser `File` objects to upload.
 * @param basePath - Optional path prefix prepended to every resolved file path.
 * @param onProgress - Optional callback invoked after each file is processed.
 * @returns An array of successfully stored `StoredFile` records.
 */
export async function processFileUpload(
  files: File[],
  basePath: string = '',
  onProgress?: UploadProgressCallback
): Promise<StoredFile[]> {
  const mdFiles = filterMarkdownFiles(files);
  const storedFiles: StoredFile[] = [];

  const BATCH_SIZE = 10;
  let processedCount = 0;

  const updateBatchProgress = (
    batchResults: PromiseSettledResult<StoredFile | null>[],
    batch: File[]
  ) => {
    for (const [j, result] of batchResults.entries()) {
      const file = batch[j];

      if (result.status === 'fulfilled' && result.value) {
        storedFiles.push(result.value);
      } else if (result.status === 'rejected') {
        console.error(`Failed to process file ${file.name}:`, result.reason);
      }

      processedCount++;

      onProgress?.({
        total: mdFiles.length,
        processed: processedCount,
        currentFile: processedCount < mdFiles.length ? mdFiles[processedCount]?.name || '' : '',
      });
    }
  };

  for (let i = 0; i < mdFiles.length; i += BATCH_SIZE) {
    const batch = mdFiles.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.warning(`Skipped "${file.name}" — exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`);
          return null;
        }

        const content = await file.text();
        const path = getFilePath(file, basePath);

        return fileStorageDB.addFile({
          name: file.name,
          path,
          parentPath: getParentPath(path),
          content,
          size: file.size,
          contentHash: await sha256(content),
        });
      })
    );

    updateBatchProgress(batchResults, batch);
  }

  onProgress?.({
    total: mdFiles.length,
    processed: mdFiles.length,
    currentFile: '',
  });

  return storedFiles;
}

/**
 * Creates directory records in IndexedDB for each path in `dirPaths`.
 *
 * Paths that already exist are silently skipped (the underlying `addDirectory`
 * call returns `null` on conflict). Individual failures are logged to the
 * console but do not abort the remaining directories.
 *
 * @async
 * @param dirPaths - Normalized directory paths to create, sorted parent-first.
 * @returns The `StoredDirectory` records that were successfully inserted.
 */
async function ensureDirectories(dirPaths: string[]): Promise<StoredDirectory[]> {
  const storedDirs: StoredDirectory[] = [];

  for (const dirPath of dirPaths) {
    const name = dirPath.split('/').pop() || '';
    try {
      const dir = await fileStorageDB.addDirectory({
        name,
        path: dirPath,
        parentPath: getParentPath(dirPath),
      });
      if (dir) storedDirs.push(dir);
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
    }
  }

  return storedDirs;
}

/**
 * Persists a directory upload to IndexedDB, creating all required ancestor directories first.
 *
 * Expects `fileList` to contain files with `webkitRelativePath` set (as provided
 * by `<input type="file" webkitdirectory>` or the drag-drop path). Non-markdown
 * files are filtered out before processing.
 *
 * @async
 * @param fileList - A `FileList` or `File[]` from a directory input or drag-drop.
 * @param onProgress - Optional callback forwarded to {@link processFileUpload}.
 * @returns An object with the stored `files` and `directories`.
 */
export async function processDirectoryUpload(
  fileList: FileList | File[],
  onProgress?: UploadProgressCallback
): Promise<{ files: StoredFile[]; directories: StoredDirectory[] }> {
  const mdFiles = filterMarkdownFiles(Array.from(fileList as Iterable<File>));

  if (mdFiles.length === 0) {
    return { files: [], directories: [] };
  }

  const filePaths = mdFiles.map((file) => getFilePath(file));
  const dirPaths = extractDirectoryPaths(filePaths);
  const directories = await ensureDirectories(dirPaths);

  const files = await processFileUpload(mdFiles, '', onProgress);
  return { files, directories };
}

/**
 * Minimal subset of the browser's `FileSystemEntry` API used for drag-drop handling.
 *
 * Typed locally to avoid a `lib.dom` version dependency. Only the properties
 * actually accessed by this module are declared.
 */
interface FileSystemEntry {
  /** `true` when this entry represents a regular file. */
  isFile: boolean;
  /** `true` when this entry represents a directory. */
  isDirectory: boolean;
  /** The entry's filename (without path). */
  name: string;
  /** Absolute path within the dropped file system tree, always starting with `/`. */
  fullPath: string;
  /** Reads the entry as a `File` object. Only present when `isFile` is `true`. */
  file?: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void;
  /** Returns a reader for iterating child entries. Only present when `isDirectory` is `true`. */
  createReader?: () => FileSystemDirectoryReader;
}

/** Minimal subset of the browser's `FileSystemDirectoryReader` API used for drag-drop traversal. */
interface FileSystemDirectoryReader {
  readEntries: (
    callback: (entries: FileSystemEntry[]) => void,
    errorCallback?: (error: Error) => void
  ) => void;
}

/**
 * Wraps the callback-based `FileSystemEntry.file()` in a Promise.
 *
 * Also patches `webkitRelativePath` onto the resulting `File` so downstream
 * code can derive the correct storage path from `entry.fullPath`.
 *
 * @param fileMethod - The bound `file()` method from a `FileSystemEntry`.
 * @param fullPath - The entry's `fullPath`, used to set `webkitRelativePath`.
 * @returns A `Promise` that resolves with the `File` object.
 */
function readEntryAsFile(
  fileMethod: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void,
  fullPath: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    fileMethod((f) => {
      Object.defineProperty(f, 'webkitRelativePath', {
        value: fullPath.substring(1), // Remove leading /
        writable: false,
        configurable: true,
      });
      resolve(f);
    }, reject);
  });
}

/**
 * Recursively read all files from a directory entry (for drag-drop).
 *
 * The File System Access API's readEntries() callback is synchronous from the
 * API's perspective — it does not await its callback's return value. Using an
 * async callback there causes unhandled rejections to silently swallow errors
 * and leaves the outer Promise permanently pending. This implementation avoids
 * async callbacks entirely by wrapping each step in its own Promise.
 */
async function readDirectoryEntries(
  dirEntry: FileSystemEntry,
  depth: number = 0,
  fileCount?: { value: number }
): Promise<File[]> {
  const counter = fileCount ?? { value: 0 };
  if (depth > MAX_DIRECTORY_DEPTH) {
    toast.warning('Directory too deeply nested — skipping further subdirectories');
    return [];
  }

  const reader = dirEntry.createReader?.();
  if (!reader) return [];

  const files: File[] = [];

  while (true) {
    const entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });

    if (entries.length === 0) break;

    for (const entry of entries) {
      if (counter.value >= MAX_FILE_COUNT) {
        toast.warning(`File limit reached (${MAX_FILE_COUNT}) — remaining files skipped`);
        return files;
      }

      if (entry.isFile && entry.file) {
        const file = await readEntryAsFile(entry.file.bind(entry), entry.fullPath);
        files.push(file);
        counter.value++;
      } else if (entry.isDirectory) {
        const subFiles = await readDirectoryEntries(entry, depth + 1, counter);
        files.push(...subFiles);
      }
    }
  }

  return files;
}

/**
 * Handles a drag-drop event by reading all dropped files or directories and
 * persisting them to IndexedDB.
 *
 * Uses the `FileSystem Access API` (`webkitGetAsEntry`) to recursively traverse
 * dropped directories up to `MAX_DIRECTORY_DEPTH` levels deep. Plain file drops
 * are handled via `DataTransferItem.getAsFile()`. Mixed drops (files and
 * directories together) treat the entire batch as a directory upload.
 *
 * @async
 * @param items - The `DataTransferItemList` from a `drop` event.
 * @param onProgress - Optional callback forwarded to the underlying upload functions.
 * @returns Stored files, directories, and a flag indicating whether a directory was dropped.
 */
export async function processDroppedItems(
  items: DataTransferItemList,
  onProgress?: UploadProgressCallback
): Promise<{ files: StoredFile[]; directories: StoredDirectory[]; isDirectory: boolean }> {
  const allFiles: File[] = [];
  let isDirectory = false;

  for (const item of Array.from(items)) {
    if (item.kind !== 'file') continue;

    const entry = item.webkitGetAsEntry?.() as FileSystemEntry | null;

    if (entry?.isDirectory) {
      isDirectory = true;
      const dirFiles = await readDirectoryEntries(entry);
      allFiles.push(...dirFiles);
    } else if (entry?.isFile) {
      const file = item.getAsFile();
      if (file) {
        allFiles.push(file);
      }
    }
  }

  if (isDirectory) {
    return { ...(await processDirectoryUpload(allFiles, onProgress)), isDirectory: true };
  }

  return {
    files: await processFileUpload(allFiles, '', onProgress),
    directories: [],
    isDirectory: false,
  };
}
