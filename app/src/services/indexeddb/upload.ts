import { fileStorageDB, getParentPath, normalizePath } from './db';
import type { StoredFile, StoredDirectory, UploadProgressCallback } from './types';

/**
 * Check if a file is a markdown file
 */
export function isMarkdownFile(fileName: string): boolean {
  const name = fileName.toLowerCase();
  return name.endsWith('.md') || name.endsWith('.markdown');
}

/**
 * Filter files to only include markdown files
 */
export function filterMarkdownFiles(files: File[]): File[] {
  return files.filter((file) => isMarkdownFile(file.name));
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
  // webkitRelativePath is set when uploading directories
  if (file.webkitRelativePath) {
    return normalizePath(basePath + '/' + file.webkitRelativePath);
  }
  return normalizePath(basePath + '/' + file.name);
}

/**
 * Process and upload individual files
 */
export async function processFileUpload(
  files: File[],
  basePath: string = '',
  onProgress?: UploadProgressCallback
): Promise<StoredFile[]> {
  const mdFiles = filterMarkdownFiles(files);
  const storedFiles: StoredFile[] = [];

  for (let i = 0; i < mdFiles.length; i++) {
    const file = mdFiles[i];

    onProgress?.({
      total: mdFiles.length,
      processed: i,
      currentFile: file.name,
    });

    try {
      const content = await readFileAsText(file);
      const path = getFilePath(file, basePath);
      const parentPath = getParentPath(path);

      // Check if file already exists
      const existing = await fileStorageDB.getFileByPath(path);
      if (existing) {
        // Skip duplicate files
        continue;
      }

      const storedFile = await fileStorageDB.addFile({
        name: file.name,
        path,
        parentPath,
        content,
        size: file.size,
      });

      storedFiles.push(storedFile);
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
    }
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
    // Check if directory already exists
    const existing = await fileStorageDB.getDirectoryByPath(dirPath);
    if (existing) {
      continue;
    }

    const name = dirPath.split('/').pop() || '';
    const parentPath = getParentPath(dirPath);

    try {
      const dir = await fileStorageDB.addDirectory({
        name,
        path: dirPath,
        parentPath,
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
  // Convert FileList to array
  const allFiles = Array.from(fileList);

  // Filter to only markdown files
  const mdFiles = filterMarkdownFiles(allFiles);

  if (mdFiles.length === 0) {
    return { files: [], directories: [] };
  }

  // Extract directory paths from the filtered files
  const filePaths = mdFiles.map((file) => getFilePath(file));
  const dirPaths = extractDirectoryPaths(filePaths);

  // Create directories first
  const directories = await ensureDirectories(dirPaths);

  // Then upload files
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

/**
 * Recursively read all files from a directory entry (for drag-drop)
 */
async function readDirectoryEntries(dirEntry: FileSystemEntry): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const reader = dirEntry.createReader?.();
    if (!reader) {
      resolve([]);
      return;
    }

    const files: File[] = [];

    const readBatch = () => {
      reader.readEntries(
        async (entries) => {
          if (entries.length === 0) {
            resolve(files);
            return;
          }

          for (const entry of entries) {
            if (entry.isFile && entry.file) {
              const file = await new Promise<File>((res, rej) => {
                entry.file!((f) => {
                  // Create a new File with the full path in webkitRelativePath
                  const newFile = new File([f], f.name, { type: f.type });
                  Object.defineProperty(newFile, 'webkitRelativePath', {
                    value: entry.fullPath.substring(1), // Remove leading /
                    writable: false,
                  });
                  res(newFile);
                }, rej);
              });
              files.push(file);
            } else if (entry.isDirectory) {
              const subFiles = await readDirectoryEntries(entry);
              files.push(...subFiles);
            }
          }

          // Continue reading (directories may have more than 100 entries)
          readBatch();
        },
        (error) => reject(error)
      );
    };

    readBatch();
  });
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
    // Process as directory upload
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
