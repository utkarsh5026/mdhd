import { toast } from 'sonner';
import { fileStorageDB, getParentPath, normalizePath } from './db';
import type { StoredFile, StoredDirectory, UploadProgressCallback } from './types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Filter files to only include markdown files
 */
export function filterMarkdownFiles(files: File[]): File[] {
  return files.filter(({ name }) => {
    const filename = name.toLowerCase();
    return filename.endsWith('.md') || filename.endsWith('.markdown');
  });
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Extract unique directory paths from file paths
 */
export function extractDirectoryPaths(filePaths: string[]): string[] {
  const dirs = new Set<string>();

  for (const filePath of filePaths) {
    const normalized = normalizePath(filePath);
    let current = getParentPath(normalized);

    while (current !== '/') {
      dirs.add(current);
      current = getParentPath(current);
    }
  }

  // Sort by path length to ensure parents are created before children
  return Array.from(dirs).sort((a, b) => a.length - b.length);
}

/**
 * Get the file path from a File object (handles webkitRelativePath for directories)
 */
export function getFilePath(file: File, basePath: string = ''): string {
  return normalizePath(basePath + '/' + (file.webkitRelativePath || file.name));
}

/**
 * Process and upload individual files with batched parallel operations
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
    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
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
        const content = await readFileAsText(file);
        const path = getFilePath(file, basePath);
        const parentPath = getParentPath(path);

        // addFile returns null if the path already exists (ConstraintError),
        // avoiding a separate existence check that would be a TOCTOU race.
        return fileStorageDB.addFile({
          name: file.name,
          path,
          parentPath,
          content,
          size: file.size,
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
 * Create directories from a list of paths
 */
async function ensureDirectories(dirPaths: string[]): Promise<StoredDirectory[]> {
  const storedDirs: StoredDirectory[] = [];

  for (const dirPath of dirPaths) {
    if (await fileStorageDB.getDirectoryByPath(dirPath)) {
      continue;
    }

    const name = dirPath.split('/').pop() || '';
    try {
      const dir = await fileStorageDB.addDirectory({
        name,
        path: dirPath,
        parentPath: getParentPath(dirPath),
      });
      storedDirs.push(dir);
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
    }
  }

  return storedDirs;
}

/**
 * Process and upload a directory (from FileList with webkitRelativePath)
 */
export async function processDirectoryUpload(
  fileList: FileList,
  onProgress?: UploadProgressCallback
): Promise<{ files: StoredFile[]; directories: StoredDirectory[] }> {
  const mdFiles = filterMarkdownFiles(Array.from(fileList));

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
 * Interface for drag-drop file entries
 */
interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file?: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void;
  createReader?: () => FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
  readEntries: (
    callback: (entries: FileSystemEntry[]) => void,
    errorCallback?: (error: Error) => void
  ) => void;
}

const MAX_DIRECTORY_DEPTH = 10;
const MAX_FILE_COUNT = 1000;

/**
 * Wraps the callback-based FileSystemEntry.file() in a Promise.
 */
function readEntryAsFile(
  fileMethod: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void,
  fullPath: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    fileMethod((f) => {
      const newFile = new File([f], f.name, { type: f.type });
      Object.defineProperty(newFile, 'webkitRelativePath', {
        value: fullPath.substring(1), // Remove leading /
        writable: false,
      });
      resolve(newFile);
    }, reject);
  });
}

/**
 * Wraps the callback-based FileSystemDirectoryReader.readEntries() in a Promise.
 * readEntries() must be called repeatedly until it returns an empty array.
 */
function readNextBatch(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject);
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
  fileCount: { value: number } = { value: 0 }
): Promise<File[]> {
  if (depth > MAX_DIRECTORY_DEPTH) {
    toast.warning('Directory too deeply nested — skipping further subdirectories');
    return [];
  }

  const reader = dirEntry.createReader?.();
  if (!reader) return [];

  const files: File[] = [];

  // readEntries() returns at most ~100 entries per call; loop until empty.
  while (true) {
    const entries = await readNextBatch(reader);
    if (entries.length === 0) break;

    for (const entry of entries) {
      if (fileCount.value >= MAX_FILE_COUNT) {
        toast.warning(`File limit reached (${MAX_FILE_COUNT}) — remaining files skipped`);
        return files;
      }

      if (entry.isFile && entry.file) {
        const file = await readEntryAsFile(entry.file.bind(entry), entry.fullPath);
        files.push(file);
        fileCount.value++;
      } else if (entry.isDirectory) {
        const subFiles = await readDirectoryEntries(entry, depth + 1, fileCount);
        files.push(...subFiles);
      }
    }
  }

  return files;
}

/**
 * Process drag-drop data transfer items
 */
export async function processDroppedItems(
  items: DataTransferItemList,
  onProgress?: UploadProgressCallback
): Promise<{ files: StoredFile[]; directories: StoredDirectory[]; isDirectory: boolean }> {
  const allFiles: File[] = [];
  let isDirectory = false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
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
    const fileList = {
      length: allFiles.length,
      item: (index: number) => allFiles[index],
      [Symbol.iterator]: function* () {
        for (let i = 0; i < allFiles.length; i++) {
          yield allFiles[i];
        }
      },
    } as FileList;

    // Manually set the array-like access
    allFiles.forEach((file, index) => {
      (fileList as Record<number, File>)[index] = file;
    });

    return { ...(await processDirectoryUpload(fileList, onProgress)), isDirectory: true };
  } else {
    // Process as individual files
    const files = await processFileUpload(allFiles, '', onProgress);
    return { files, directories: [], isDirectory: false };
  }
}
