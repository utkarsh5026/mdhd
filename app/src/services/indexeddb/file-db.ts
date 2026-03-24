import { v4 as uuidv4 } from 'uuid';

import { BaseDB } from './create-db';
import type {
  CreateDirectoryInput,
  CreateFileInput,
  FileTreeNode,
  StoredDirectory,
  StoredFile,
} from './types';

const FILES_STORE = 'files';
const DIRECTORIES_STORE = 'directories';

/**
 * Returns the parent directory path of a given full path.
 *
 * Finds the last `/` and slices everything before it. Returns `'/'` when the
 * path is at the root level (i.e. no parent segment exists).
 *
 * @param path - A normalized, forward-slash-delimited path string.
 * @returns The parent path, or `'/'` if the path is already at the root.
 */
export function getParentPath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return path.substring(0, lastSlash);
}

/**
 * Normalizes a file path to a canonical form for consistent IndexedDB lookups.
 *
 * Converts all backslashes to forward slashes, prepends a leading `/` if absent,
 * and strips a trailing `/` (except for the bare root `'/'`).
 *
 * @param path - The raw path string to normalize (may use `\` or `/` separators).
 * @returns A normalized path that always starts with `/` and has no trailing slash.
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
 * IndexedDB wrapper for persistent client-side file and directory storage.
 *
 * Manages two object stores — `files` and `directories` — both indexed by
 * `path` (unique) and `parentPath`. The underlying database is named
 * `'mdhd-files'` at schema version 1.
 */
class FileStorageDB extends BaseDB {
  constructor() {
    super('mdhd-files', 1);
  }

  /**
   * Called by `BaseDB` when the database is opened at a new version.
   *
   * Version 1 creates the `files` and `directories` object stores with their
   * `path` (unique) and `parentPath` indexes. Future migrations should be added
   * as additional `if (oldVersion < N)` blocks below.
   *
   * @param db - The raw `IDBDatabase` instance being upgraded.
   * @param oldVersion - The previous schema version (0 on first open).
   */
  protected onUpgrade(db: IDBDatabase, oldVersion: number): void {
    if (oldVersion < 1) {
      const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
      filesStore.createIndex('path', 'path', { unique: true });
      filesStore.createIndex('parentPath', 'parentPath', { unique: false });

      const dirsStore = db.createObjectStore(DIRECTORIES_STORE, { keyPath: 'id' });
      dirsStore.createIndex('path', 'path', { unique: true });
      dirsStore.createIndex('parentPath', 'parentPath', { unique: false });
    }

    // Future versions: add migration blocks here, e.g.:
    // if (oldVersion < 2) { /* migrate v1 → v2 */ }
  }

  /**
   * Retrieves a single record from an object store by its primary key.
   *
   * @template T - The expected record type.
   * @param storeName - The name of the object store to query.
   * @param id - The primary key (UUID) of the record to fetch.
   * @returns The matching record, or `undefined` if not found.
   */
  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    return this.withStore(storeName, 'readonly', (store) => store.get(id));
  }

  /**
   * Retrieves a single record from an object store using the `path` index.
   *
   * The path is normalized before querying so callers do not need to
   * pre-normalize it.
   *
   * @template T - The expected record type.
   * @param storeName - The name of the object store to query.
   * @param path - The file or directory path to look up.
   * @returns The matching record, or `undefined` if not found.
   */
  private async getByPath<T>(storeName: string, path: string): Promise<T | undefined> {
    return this.withStore(storeName, 'readonly', (store) =>
      store.index('path').get(normalizePath(path))
    );
  }

  /**
   * Retrieves all records from an object store.
   *
   * @template T - The expected record type.
   * @param storeName - The name of the object store to query.
   * @returns An array of all records, or an empty array if the store is empty.
   */
  private async getAll<T>(storeName: string): Promise<T[]> {
    return this.withStore(storeName, 'readonly', (store) => store.getAll(), {
      defaultValue: [] as unknown as T[],
    });
  }

  /**
   * Deletes a single record from an object store by its primary key.
   *
   * @param storeName - The name of the object store to delete from.
   * @param id - The primary key (UUID) of the record to delete.
   */
  private async deleteById(storeName: string, id: string): Promise<void> {
    return this.withStore(storeName, 'readwrite', (store) => store.delete(id));
  }

  /**
   * Atomically reads a record, applies a transformation, and writes it back.
   *
   * The read and write occur within a single `readwrite` transaction so that
   * no other operation can interleave between them.
   *
   * @template T - The record type stored in the object store.
   * @param storeName - The name of the object store to operate on.
   * @param id - The primary key (UUID) of the record to update.
   * @param modifier - Pure function that receives the current record and returns the updated one.
   * @returns The updated record, or `undefined` if no record with that `id` exists.
   * @throws {Error} If the read or write step fails at the IDB level.
   */
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

  /**
   * Persists a new file record to IndexedDB.
   *
   * Generates a UUID, normalizes the `path` and `parentPath`, and stamps
   * `createdAt` / `updatedAt` timestamps before inserting.
   *
   * @async
   * @param input - The file data to store (name, path, parentPath, content, size, type).
   * @returns The stored `StoredFile` record on success, or `null` if a file at
   *   the same path already exists (IDB `ConstraintError`).
   * @throws {Error} If the insert fails for any reason other than a duplicate path.
   */
  async addFile(input: CreateFileInput): Promise<StoredFile | null> {
    const now = Date.now();
    const file: StoredFile = {
      ...input,
      id: uuidv4(),
      path: normalizePath(input.path),
      parentPath: normalizePath(input.parentPath),
      createdAt: now,
      updatedAt: now,
    };

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readwrite');
      const request = transaction.objectStore(FILES_STORE).add(file);

      request.onsuccess = () => resolve(file);
      request.onerror = () => {
        if (request.error?.name === 'ConstraintError') {
          transaction.abort();
          resolve(null);
        } else {
          reject(new Error('Failed to add file'));
        }
      };
    });
  }

  /**
   * Retrieves a file record by its UUID.
   *
   * @async
   * @param id - The UUID of the file to fetch.
   * @returns The `StoredFile`, or `undefined` if not found.
   */
  async getFile(id: string): Promise<StoredFile | undefined> {
    return this.getById(FILES_STORE, id);
  }

  /**
   * Retrieves a file record by its storage path.
   *
   * @async
   * @param path - The file path (normalized before querying).
   * @returns The `StoredFile`, or `undefined` if not found.
   */
  async getFileByPath(path: string): Promise<StoredFile | undefined> {
    return this.getByPath(FILES_STORE, path);
  }

  /**
   * Replaces the content of an existing file and updates its metadata.
   *
   * Recalculates `size` from the new content string and stamps a new
   * `updatedAt` timestamp. The operation is atomic via `readModifyWrite`.
   *
   * @async
   * @param id - The UUID of the file to update.
   * @param content - The new file content string.
   * @returns The updated `StoredFile`, or `undefined` if no file with that `id` exists.
   */
  async updateFile(id: string, content: string): Promise<StoredFile | undefined> {
    return this.readModifyWrite<StoredFile>(FILES_STORE, id, (file) => ({
      ...file,
      content,
      size: new Blob([content]).size,
      updatedAt: Date.now(),
    }));
  }

  /**
   * Deletes a file record by its UUID.
   *
   * @async
   * @param id - The UUID of the file to delete.
   */
  async deleteFile(id: string): Promise<void> {
    return this.deleteById(FILES_STORE, id);
  }

  /**
   * Persists a new directory record to IndexedDB.
   *
   * Generates a UUID, normalizes the `path` and `parentPath`, and stamps a
   * `createdAt` timestamp before inserting.
   *
   * @async
   * @param input - The directory data to store (name, path, parentPath).
   * @returns The stored `StoredDirectory` on success, or `null` if a directory
   *   at the same path already exists (IDB `ConstraintError`).
   * @throws {Error} If the insert fails for any reason other than a duplicate path.
   */
  async addDirectory(input: CreateDirectoryInput): Promise<StoredDirectory | null> {
    const dir: StoredDirectory = {
      ...input,
      id: uuidv4(),
      path: normalizePath(input.path),
      parentPath: normalizePath(input.parentPath),
      createdAt: Date.now(),
    };

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DIRECTORIES_STORE], 'readwrite');
      const request = transaction.objectStore(DIRECTORIES_STORE).add(dir);

      request.onsuccess = () => resolve(dir);
      request.onerror = () => {
        if (request.error?.name === 'ConstraintError') {
          transaction.abort();
          resolve(null);
        } else {
          reject(new Error('Failed to add directory'));
        }
      };
    });
  }

  /**
   * Retrieves all directory records from the store.
   *
   * @async
   * @returns An array of every `StoredDirectory`, or an empty array if none exist.
   */
  async getAllDirectories(): Promise<StoredDirectory[]> {
    return this.getAll(DIRECTORIES_STORE);
  }

  /**
   * Deletes a directory and all files and subdirectories beneath it.
   *
   * Scans both the `files` and `directories` stores with a cursor inside a
   * single `readwrite` transaction, deleting every record whose path equals or
   * starts with the normalized target path. This ensures the operation is
   * atomic — either everything is removed or nothing is.
   *
   * @async
   * @param path - The path of the directory to delete (recursively).
   * @throws {Error} If the transaction fails partway through.
   */
  async deleteDirectoryRecursive(path: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE, DIRECTORIES_STORE], 'readwrite');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to delete directory recursively'));

      const deleteFromStore = <T extends { path: string }>(
        storeName: string,
        predicate: (value: T) => boolean
      ) => {
        const request = transaction.objectStore(storeName).openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            if (predicate(cursor.value as T)) cursor.delete();
            cursor.continue();
          }
        };
        request.onerror = () => transaction.abort();
      };

      deleteFromStore<StoredFile>(
        FILES_STORE,
        (file) => file.path === normalizedPath || file.path.startsWith(normalizedPath + '/')
      );
      deleteFromStore<StoredDirectory>(
        DIRECTORIES_STORE,
        (dir) => dir.path === normalizedPath || dir.path.startsWith(normalizedPath + '/')
      );
    });
  }

  /**
   * Retrieves lightweight metadata for every file without loading content into memory.
   *
   * Uses an IDB cursor to iterate records one at a time, extracting only
   * `id`, `name`, `path`, and `size`. This avoids holding all file content
   * in memory when building the file tree.
   *
   * @async
   * @returns An array of partial file records containing only metadata fields.
   * @throws {Error} If the cursor request fails.
   */
  private async getAllFileMetadata(): Promise<Pick<StoredFile, 'id' | 'name' | 'path' | 'size'>[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readonly');
      const request = transaction.objectStore(FILES_STORE).openCursor();
      const results: Pick<StoredFile, 'id' | 'name' | 'path' | 'size'>[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const { id, name, path, size } = cursor.value as StoredFile;
          results.push({ id, name, path, size });
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error('Failed to read file metadata'));
    });
  }

  /**
   * Builds the complete nested file tree from all stored files and directories.
   *
   * Loads all directory records and file metadata, maps every node by its path,
   * then links each node to its parent. Nodes whose parent path is `'/'` or
   * whose parent is missing are placed at the root level.
   *
   * The resulting tree is sorted at every level with directories first,
   * then files, both groups sorted alphabetically by name.
   *
   * @async
   * @returns A sorted array of root-level `FileTreeNode` objects, each with
   *   nested `children` for directories.
   */
  async buildFileTree(): Promise<FileTreeNode[]> {
    const files = await this.getAllFileMetadata();
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

  /**
   * Wipes all files and directories from IndexedDB in a single transaction.
   *
   * Intended for a full reset — both the `files` and `directories` stores are
   * cleared atomically.
   *
   * @async
   * @throws {Error} If the transaction fails.
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
}

export const fileStorageDB = new FileStorageDB();
