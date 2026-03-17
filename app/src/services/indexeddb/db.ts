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
        this.db.onclose = () => {
          this.db = null;
          this.initPromise = null;
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
          filesStore.createIndex('path', 'path', { unique: true });
          filesStore.createIndex('parentPath', 'parentPath', { unique: false });
        }

        if (!db.objectStoreNames.contains(DIRECTORIES_STORE)) {
          const dirsStore = db.createObjectStore(DIRECTORIES_STORE, { keyPath: 'id' });
          dirsStore.createIndex('path', 'path', { unique: true });
          dirsStore.createIndex('parentPath', 'parentPath', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
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

  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    return this.withStore(storeName, 'readonly', (store) => store.get(id));
  }

  private async getByPath<T>(storeName: string, path: string): Promise<T | undefined> {
    return this.withStore(storeName, 'readonly', (store) =>
      store.index('path').get(normalizePath(path))
    );
  }

  private async getByParentPath<T>(storeName: string, parentPath: string): Promise<T[]> {
    return this.withStore(
      storeName,
      'readonly',
      (store) => store.index('parentPath').getAll(normalizePath(parentPath)),
      { defaultValue: [] as unknown as T[] }
    );
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    return this.withStore(storeName, 'readonly', (store) => store.getAll(), {
      defaultValue: [] as unknown as T[],
    });
  }

  private async deleteById(storeName: string, id: string): Promise<void> {
    return this.withStore(storeName, 'readwrite', (store) => store.delete(id));
  }

  private async deleteByPredicate<T>(
    storeName: string,
    predicate: (value: T) => boolean
  ): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const request = transaction.objectStore(storeName).openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (predicate(cursor.value)) cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
    });
  }

  private async readModifyWrite<T>(
    storeName: string,
    id: string,
    modifier: (item: T) => T
  ): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result as T | undefined;
        if (!item) {
          resolve(undefined);
          return;
        }
        const updated = modifier(item);
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () => reject(new Error(`Failed to update in ${storeName}`));
      };

      getRequest.onerror = () => reject(new Error(`Failed to read from ${storeName} for update`));
    });
  }

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

  async getFile(id: string): Promise<StoredFile | undefined> {
    return this.getById(FILES_STORE, id);
  }

  async getFileByPath(path: string): Promise<StoredFile | undefined> {
    return this.getByPath(FILES_STORE, path);
  }

  async getFilesByParentPath(parentPath: string): Promise<StoredFile[]> {
    return this.getByParentPath(FILES_STORE, parentPath);
  }

  async getAllFiles(): Promise<StoredFile[]> {
    return this.getAll(FILES_STORE);
  }

  async updateFile(id: string, content: string): Promise<StoredFile | undefined> {
    return this.readModifyWrite<StoredFile>(FILES_STORE, id, (file) => ({
      ...file,
      content,
      size: new Blob([content]).size,
      updatedAt: Date.now(),
    }));
  }

  async deleteFile(id: string): Promise<void> {
    return this.deleteById(FILES_STORE, id);
  }

  async deleteFilesByPathPrefix(pathPrefix: string): Promise<void> {
    const normalizedPrefix = normalizePath(pathPrefix);
    return this.deleteByPredicate<StoredFile>(FILES_STORE, (file) =>
      file.path.startsWith(normalizedPrefix)
    );
  }

  // ============ Directory Operations ============

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

  async getDirectory(id: string): Promise<StoredDirectory | undefined> {
    return this.getById(DIRECTORIES_STORE, id);
  }

  async getDirectoryByPath(path: string): Promise<StoredDirectory | undefined> {
    return this.getByPath(DIRECTORIES_STORE, path);
  }

  async getDirectoriesByParentPath(parentPath: string): Promise<StoredDirectory[]> {
    return this.getByParentPath(DIRECTORIES_STORE, parentPath);
  }

  async getAllDirectories(): Promise<StoredDirectory[]> {
    return this.getAll(DIRECTORIES_STORE);
  }

  async deleteDirectory(id: string): Promise<void> {
    return this.deleteById(DIRECTORIES_STORE, id);
  }

  async deleteDirectoryRecursive(path: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    await this.deleteByPredicate<StoredFile>(FILES_STORE, (file) =>
      file.path.startsWith(normalizedPath)
    );
    await this.deleteByPredicate<StoredDirectory>(
      DIRECTORIES_STORE,
      (dir) => dir.path === normalizedPath || dir.path.startsWith(normalizedPath + '/')
    );
  }

  // ============ Tree Operations ============

  async buildFileTree(): Promise<FileTreeNode[]> {
    const files = await this.getAllFiles();
    const directories = await this.getAllDirectories();

    const nodeMap = new Map<string, FileTreeNode>();

    for (const dir of directories) {
      nodeMap.set(dir.path, {
        id: dir.id,
        name: dir.name,
        path: dir.path,
        type: 'directory',
        children: [],
      });
    }

    for (const file of files) {
      nodeMap.set(file.path, {
        id: file.id,
        name: file.name,
        path: file.path,
        type: 'file',
        size: file.size,
      });
    }

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

  async fileExists(path: string): Promise<boolean> {
    const file = await this.getFileByPath(path);
    return !!file;
  }

  async directoryExists(path: string): Promise<boolean> {
    const dir = await this.getDirectoryByPath(path);
    return !!dir;
  }
}

export const fileStorageDB = new FileStorageDB();
