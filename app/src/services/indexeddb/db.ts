import { v4 as uuidv4 } from 'uuid';
import type {
  StoredFile,
  StoredDirectory,
  FileTreeNode,
  CreateFileInput,
  CreateDirectoryInput,
} from './types';

const DB_NAME = 'mdhd-files';
const DB_VERSION = 1;
const FILES_STORE = 'files';
const DIRECTORIES_STORE = 'directories';

type StoreOperationOptions<T> = {
  resolvedValue?: T;
  defaultValue?: T;
  errorMessage?: string;
};

/**
 * Get the parent path from a full path
 */
export function getParentPath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return path.substring(0, lastSlash);
}

/**
 * Normalize a path to use forward slashes and ensure it starts with /
 */
export function normalizePath(path: string): string {
  let normalized = path.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  // Remove trailing slash except for root
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * FileStorageDB - IndexedDB wrapper for file storage
 */
class FileStorageDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create files store with indexes
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
          filesStore.createIndex('path', 'path', { unique: true });
          filesStore.createIndex('parentPath', 'parentPath', { unique: false });
        }

        // Create directories store with indexes
        if (!db.objectStoreNames.contains(DIRECTORIES_STORE)) {
          const dirsStore = db.createObjectStore(DIRECTORIES_STORE, { keyPath: 'id' });
          dirsStore.createIndex('path', 'path', { unique: true });
          dirsStore.createIndex('parentPath', 'parentPath', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get the database instance
   */
  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // ============ File Operations ============

  /**
   * Add a new file
   */
  async addFile(input: CreateFileInput): Promise<StoredFile> {
    const now = Date.now();
    const file: StoredFile = {
      ...input,
      id: uuidv4(),
      path: normalizePath(input.path),
      parentPath: normalizePath(input.parentPath),
      createdAt: now,
      updatedAt: now,
    };

    return this.withStore(FILES_STORE, 'readwrite', (store) => store.add(file), {
      resolvedValue: file,
      errorMessage: 'Failed to add file',
    });
  }

  private async withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest,
    options: StoreOperationOptions<T> = { errorMessage: 'Store operation failed' }
  ): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const { resolvedValue, errorMessage, defaultValue } = options;
      const transaction = db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () =>
        resolve(resolvedValue !== undefined ? resolvedValue : request.result || defaultValue);
      request.onerror = () => reject(new Error(errorMessage));
    });
  }

  /**
   * Get a file by ID
   */
  async getFile(id: string): Promise<StoredFile | undefined> {
    return this.withStore(FILES_STORE, 'readonly', (store) => store.get(id));
  }

  /**
   * Get a file by path
   */
  async getFileByPath(path: string): Promise<StoredFile | undefined> {
    const normalizedPath = normalizePath(path);
    return this.withStore(
      FILES_STORE,
      'readonly',
      (store) => store.index('path').get(normalizedPath),
      {
        errorMessage: 'Failed to get file by path',
      }
    );
  }

  /**
   * Get all files in a directory
   */
  async getFilesByParentPath(parentPath: string): Promise<StoredFile[]> {
    const normalizedPath = normalizePath(parentPath);
    return this.withStore(
      FILES_STORE,
      'readonly',
      (store) => store.index('parentPath').getAll(normalizedPath),
      {
        defaultValue: [],
        errorMessage: 'Failed to get files by parent path',
      }
    );
  }

  /**
   * Get all files
   */
  async getAllFiles(): Promise<StoredFile[]> {
    return this.withStore(FILES_STORE, 'readonly', (store) => store.getAll());
  }

  /**
   * Update an existing file's content
   */
  async updateFile(id: string, content: string): Promise<StoredFile | undefined> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readwrite');
      const store = transaction.objectStore(FILES_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const file = getRequest.result as StoredFile | undefined;
        if (!file) {
          resolve(undefined);
          return;
        }

        const updatedFile: StoredFile = {
          ...file,
          content,
          size: new Blob([content]).size,
          updatedAt: Date.now(),
        };

        const putRequest = store.put(updatedFile);
        putRequest.onsuccess = () => resolve(updatedFile);
        putRequest.onerror = () => reject(new Error('Failed to update file'));
      };

      getRequest.onerror = () => reject(new Error('Failed to get file for update'));
    });
  }

  /**
   * Delete a file by ID
   */
  async deleteFile(id: string): Promise<void> {
    return this.withStore(FILES_STORE, 'readwrite', (store) => store.delete(id));
  }

  /**
   * Delete all files matching a path prefix
   */
  async deleteFilesByPathPrefix(pathPrefix: string): Promise<void> {
    const db = await this.getDB();
    const normalizedPrefix = normalizePath(pathPrefix);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readwrite');
      const store = transaction.objectStore(FILES_STORE);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const file = cursor.value as StoredFile;
          if (file.path.startsWith(normalizedPrefix)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error('Failed to delete files by path prefix'));
    });
  }

  // ============ Directory Operations ============

  /**
   * Add a new directory
   */
  async addDirectory(input: CreateDirectoryInput): Promise<StoredDirectory> {
    const dir: StoredDirectory = {
      ...input,
      id: uuidv4(),
      path: normalizePath(input.path),
      parentPath: normalizePath(input.parentPath),
      createdAt: Date.now(),
    };

    return this.withStore(DIRECTORIES_STORE, 'readwrite', (store) => store.add(dir), {
      resolvedValue: dir,
      errorMessage: 'Failed to add directory',
    });
  }

  /**
   * Get a directory by ID
   */
  async getDirectory(id: string): Promise<StoredDirectory | undefined> {
    return await this.withStore(DIRECTORIES_STORE, 'readonly', (store) => store.get(id));
  }

  /**
   * Get a directory by path
   */
  async getDirectoryByPath(path: string): Promise<StoredDirectory | undefined> {
    return await this.withStore(DIRECTORIES_STORE, 'readonly', (store) => {
      const index = store.index('path');
      return index.get(normalizePath(path));
    });
  }

  /**
   * Get all directories in a parent directory
   */
  async getDirectoriesByParentPath(parentPath: string): Promise<StoredDirectory[]> {
    const normalizedPath = normalizePath(parentPath);
    return this.withStore(
      DIRECTORIES_STORE,
      'readonly',
      (store) => store.index('parentPath').getAll(normalizedPath),
      { defaultValue: [] }
    );
  }

  /**
   * Get all directories
   */
  async getAllDirectories(): Promise<StoredDirectory[]> {
    return this.withStore(DIRECTORIES_STORE, 'readonly', (store) => store.getAll(), {
      defaultValue: [],
    });
  }

  /**
   * Delete a directory by ID
   */
  async deleteDirectory(id: string): Promise<void> {
    return this.withStore(DIRECTORIES_STORE, 'readwrite', (store) => store.delete(id));
  }

  /**
   * Delete a directory and all its contents recursively
   */
  async deleteDirectoryRecursive(path: string): Promise<void> {
    const normalizedPath = normalizePath(path);

    // Delete all files in this directory and subdirectories
    await this.deleteFilesByPathPrefix(normalizedPath);

    // Delete all subdirectories
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DIRECTORIES_STORE], 'readwrite');
      const store = transaction.objectStore(DIRECTORIES_STORE);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const dir = cursor.value as StoredDirectory;
          if (dir.path === normalizedPath || dir.path.startsWith(normalizedPath + '/')) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error('Failed to delete directory recursively'));
    });
  }

  // ============ Tree Operations ============

  /**
   * Build a file tree from all files and directories
   */
  async buildFileTree(): Promise<FileTreeNode[]> {
    const files = await this.getAllFiles();
    const directories = await this.getAllDirectories();

    // Create a map for quick lookup
    const nodeMap = new Map<string, FileTreeNode>();

    // First, create all directory nodes
    for (const dir of directories) {
      nodeMap.set(dir.path, {
        id: dir.id,
        name: dir.name,
        path: dir.path,
        type: 'directory',
        children: [],
      });
    }

    // Then, create all file nodes
    for (const file of files) {
      nodeMap.set(file.path, {
        id: file.id,
        name: file.name,
        path: file.path,
        type: 'file',
        content: file.content,
        size: file.size,
      });
    }

    // Build tree structure by linking children to parents
    const root: FileTreeNode[] = [];

    for (const [path, node] of nodeMap) {
      const parentPath = getParentPath(path);
      if (parentPath === '/') {
        root.push(node);
      } else {
        const parent = nodeMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        } else {
          // Parent doesn't exist, add to root
          root.push(node);
        }
      }
    }

    // Sort: directories first, then alphabetically
    const sortNodes = (nodes: FileTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((node) => {
        if (node.children) sortNodes(node.children);
      });
    };

    sortNodes(root);
    return root;
  }

  // ============ Bulk Operations ============

  /**
   * Clear all files and directories
   */
  async clearAll(): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE, DIRECTORIES_STORE], 'readwrite');

      transaction.objectStore(FILES_STORE).clear();
      transaction.objectStore(DIRECTORIES_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear all data'));
    });
  }

  /**
   * Check if a file exists at the given path
   */
  async fileExists(path: string): Promise<boolean> {
    const file = await this.getFileByPath(path);
    return !!file;
  }

  /**
   * Check if a directory exists at the given path
   */
  async directoryExists(path: string): Promise<boolean> {
    const dir = await this.getDirectoryByPath(path);
    return !!dir;
  }
}

// Export singleton instance
export const fileStorageDB = new FileStorageDB();
