/**
 * Represents a stored markdown file in IndexedDB
 */
export interface StoredFile {
  id: string;
  name: string;
  path: string; // Full path e.g., "/docs/guide/readme.md"
  parentPath: string; // Parent directory path e.g., "/docs/guide"
  content: string;
  size: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Represents a directory in the virtual file system
 */
export interface StoredDirectory {
  id: string;
  name: string;
  path: string; // Full path e.g., "/docs/guide"
  parentPath: string; // Parent path e.g., "/docs"
  createdAt: number;
}

/**
 * Tree node for UI representation
 */
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  content?: string; // Only for files
  size?: number;
}

/**
 * Upload progress tracking
 */
export interface UploadProgress {
  total: number;
  processed: number;
  currentFile: string;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Input for creating a new file (without auto-generated fields)
 */
export type CreateFileInput = Omit<StoredFile, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input for creating a new directory (without auto-generated fields)
 */
export type CreateDirectoryInput = Omit<StoredDirectory, 'id' | 'createdAt'>;
