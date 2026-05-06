import { create, type StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import {
  fileStorageDB,
  type FileTreeNode,
  processDirectoryUpload,
  processDroppedItems,
  processFileUpload,
  type StoredFile,
  type UploadProgress,
} from '@/services/indexeddb';

import { validateFileName } from '../utils/filename';

export interface RecentFileEntry {
  id: string;
  name: string;
  path: string;
  contentHash?: string;
  accessedAt: number;
}

const RECENT_FILES_KEY = 'mdhd-recent-files';
const RECENT_FILES_LIMIT = 5;

function loadRecentFiles(): RecentFileEntry[] {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentFiles(entries: RecentFileEntry[]): void {
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage quota errors
  }
}

interface FileStoreState {
  fileTree: FileTreeNode[];
  selectedFile: StoredFile | null;
  expandedDirectories: Set<string>;
  recentFiles: RecentFileEntry[];

  isLoading: boolean;
  isUploading: boolean;
  activeUploadCount: number;
  uploadProgress: UploadProgress | null;
  error: string | null;

  isInitialized: boolean;
}

interface FileStoreActions {
  initialize: () => Promise<void>;

  refreshFileTree: () => Promise<void>;

  selectFile: (file: StoredFile) => void;
  clearSelection: () => void;

  toggleDirectory: (path: string) => void;
  expandDirectory: (path: string) => void;
  collapseDirectory: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  uploadFiles: (files: File[]) => Promise<void>;
  uploadDirectory: (files: FileList) => Promise<void>;
  handleDrop: (items: DataTransferItemList) => Promise<void>;

  deleteFile: (id: string) => Promise<void>;
  deleteDirectory: (path: string) => Promise<void>;

  renameFile: (id: string, newName: string) => Promise<void>;

  clearAll: () => Promise<void>;
  clearError: () => void;
}

type StoreType = FileStoreState & FileStoreActions;
type SetFn = StoreApi<StoreType>['setState'];
type GetFn = StoreApi<StoreType>['getState'];

/**
 * Recursively collects the paths of every directory node in a file tree.
 *
 * Performs a depth-first traversal, pushing each directory's path before
 * descending into its children.
 *
 * @param nodes - The top-level nodes of the file tree to traverse.
 * @returns A flat array of directory path strings in DFS order.
 */
function collectAllDirectoryPaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = [];

  const traverse = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      paths.push(node.path);
      node.children?.forEach(traverse);
    }
  };

  nodes.forEach(traverse);
  return paths;
}

/**
 * Merges all directory paths from a rebuilt file tree into the current expanded set.
 *
 * Used after a directory upload to automatically expand newly added directories.
 *
 * @param fileTree - The freshly built file tree containing new directory nodes.
 * @param current - The existing set of expanded directory paths.
 * @returns A new `Set` containing the union of both path collections.
 */
function mergeExpandedPaths(fileTree: FileTreeNode[], current: Set<string>): Set<string> {
  return new Set([...current, ...collectAllDirectoryPaths(fileTree)]);
}

/**
 * Wraps an async store operation with `isLoading` state and unified error handling.
 *
 * Sets `isLoading: true` before calling `fn`, and `isLoading: false` in a `finally`
 * block so callers don't need to reset it manually. On failure, sets `error` to the
 * caught message or `fallbackMsg`.
 */
async function withLoading(
  set: SetFn,
  fn: () => Promise<unknown>,
  fallbackMsg: string
): Promise<void> {
  set({ isLoading: true, error: null });
  try {
    await fn();
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : fallbackMsg,
    });
  } finally {
    set({ isLoading: false });
  }
}

/**
 * Wraps an async upload operation with full lifecycle state management.
 *
 * Increments `activeUploadCount` and sets `isUploading: true` before calling `fn`.
 * On success, rebuilds the file tree from IndexedDB and, if `expandDirs` is true,
 * merges all new directory paths into `expandedDirectories`. On failure, stores the
 * error message. In both cases, decrements `activeUploadCount` and clears `isUploading`
 * and `uploadProgress` once the count reaches zero.
 *
 * @async
 * @param set - The Zustand `setState` function for the file store.
 * @param get - The Zustand `getState` function for the file store.
 * @param fn - The async upload operation to execute.
 * @param expandDirs - When `true`, expands all directories in the rebuilt tree after upload.
 */
async function withUpload(
  set: SetFn,
  get: GetFn,
  fn: () => Promise<unknown>,
  expandDirs: boolean
): Promise<void> {
  set((s) => ({
    activeUploadCount: s.activeUploadCount + 1,
    isUploading: true,
    uploadProgress: null,
    error: null,
  }));

  try {
    await fn();

    const fileTree = await fileStorageDB.buildFileTree();
    const expandedDirectories = expandDirs
      ? mergeExpandedPaths(fileTree, get().expandedDirectories)
      : undefined;

    set((s) => {
      const newCount = s.activeUploadCount - 1;
      return {
        fileTree,
        ...(expandedDirectories && { expandedDirectories }),
        activeUploadCount: newCount,
        isUploading: newCount > 0,
        uploadProgress: newCount > 0 ? s.uploadProgress : null,
      };
    });
  } catch (error) {
    set((s) => {
      const newCount = s.activeUploadCount - 1;
      return {
        error: error instanceof Error ? error.message : 'Upload failed',
        activeUploadCount: newCount,
        isUploading: newCount > 0,
        uploadProgress: newCount > 0 ? s.uploadProgress : null,
      };
    });
  }
}

/**
 * Primary Zustand store for the file explorer.
 *
 * Manages the file tree loaded from IndexedDB, upload state (including concurrent upload
 * tracking), directory expansion, file selection, and error state. Persisted partially
 * via IndexedDB; UI state (expanded dirs, selection) lives in memory only.
 */
export const useFileStore = create<FileStoreState & FileStoreActions>()(
  devtools(
    (set, get) => ({
      fileTree: [],
      selectedFile: null,
      expandedDirectories: new Set<string>(),
      recentFiles: [],
      isLoading: false,
      isUploading: false,
      activeUploadCount: 0,
      uploadProgress: null,
      error: null,
      isInitialized: false,

      /** Initializes IndexedDB and loads the initial file tree. No-ops if already initialized. */
      initialize: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        await withLoading(
          set,
          async () => {
            const fileTree = await fileStorageDB.buildFileTree();
            const recentFiles = loadRecentFiles();
            set({ fileTree, isInitialized: true, recentFiles });
          },
          'Failed to initialize'
        );
      },

      /** Rebuilds `fileTree` from IndexedDB. Use after external changes to storage. */
      refreshFileTree: async () => {
        await withLoading(
          set,
          async () => {
            const fileTree = await fileStorageDB.buildFileTree();
            set({ fileTree });
          },
          'Failed to refresh'
        );
      },

      selectFile: (file: StoredFile) => {
        const entry: RecentFileEntry = {
          id: file.id,
          name: file.name,
          path: file.path,
          contentHash: file.contentHash,
          accessedAt: Date.now(),
        };
        const { recentFiles } = get();
        const updated = [entry, ...recentFiles.filter((r) => r.id !== file.id)].slice(
          0,
          RECENT_FILES_LIMIT
        );
        saveRecentFiles(updated);
        set({ selectedFile: file, recentFiles: updated });
      },

      clearSelection: () => {
        set({ selectedFile: null });
      },

      toggleDirectory: (path: string) => {
        const { expandedDirectories } = get();
        const newExpanded = new Set(expandedDirectories);

        if (newExpanded.has(path)) {
          newExpanded.delete(path);
        } else {
          newExpanded.add(path);
        }

        set({ expandedDirectories: newExpanded });
      },

      expandDirectory: (path: string) => {
        const { expandedDirectories } = get();
        const newExpanded = new Set(expandedDirectories);
        newExpanded.add(path);
        set({ expandedDirectories: newExpanded });
      },

      collapseDirectory: (path: string) => {
        const { expandedDirectories } = get();
        const newExpanded = new Set(expandedDirectories);
        newExpanded.delete(path);
        set({ expandedDirectories: newExpanded });
      },

      expandAll: () => {
        const { fileTree } = get();
        const allPaths = collectAllDirectoryPaths(fileTree);
        set({ expandedDirectories: new Set(allPaths) });
      },

      collapseAll: () => {
        set({ expandedDirectories: new Set() });
      },

      /**
       * Uploads a flat array of files to the root of the virtual file system.
       *
       * Streams progress updates into `uploadProgress`. Does not auto-expand directories.
       */
      uploadFiles: async (files: File[]) => {
        await withUpload(
          set,
          get,
          () =>
            processFileUpload(files, '', (progress) => {
              set({ uploadProgress: progress });
            }),
          false
        );
      },

      /**
       * Uploads a directory selected via an `<input>` element (preserving folder structure).
       *
       * Streams progress updates into `uploadProgress`. Expands all directories in the
       * rebuilt tree after a successful upload.
       */
      uploadDirectory: async (files: FileList) => {
        await withUpload(
          set,
          get,
          () =>
            processDirectoryUpload(files, (progress) => {
              set({ uploadProgress: progress });
            }),
          true
        );
      },

      /**
       * Processes items from a drag-and-drop event, uploading files and directories.
       *
       * Streams progress updates into `uploadProgress`. Expands all directories in the
       * rebuilt tree after a successful upload.
       */
      handleDrop: async (items: DataTransferItemList) => {
        await withUpload(
          set,
          get,
          () =>
            processDroppedItems(items, (progress) => {
              set({ uploadProgress: progress });
            }),
          true
        );
      },

      /**
       * Deletes a single file from IndexedDB by its ID.
       *
       * Also closes any tabs that reference the file and clears `selectedFile` if it
       * matches the deleted ID. Rebuilds `fileTree` afterwards.
       */
      deleteFile: async (id: string) => {
        await withLoading(
          set,
          async () => {
            const { selectedFile } = get();

            await fileStorageDB.deleteFile(id);
            const tabsState = useTabsStore.getState();
            const tabToClose = tabsState.tabs.find((t) => t.sourceFileId === id);
            if (tabToClose) {
              const remaining = tabsState.tabs.filter((t) => t.id !== tabToClose.id);
              const tabIndex = tabsState.tabs.indexOf(tabToClose);
              let newActiveId: string | null = null;
              if (remaining.length > 0) {
                newActiveId =
                  tabsState.activeTabId === tabToClose.id
                    ? remaining[Math.min(tabIndex, remaining.length - 1)].id
                    : tabsState.activeTabId;
              }
              tabsState.setTabsState(remaining, newActiveId, remaining.length === 0);
            }

            if (selectedFile?.id === id) {
              set({ selectedFile: null });
            }

            const { recentFiles } = get();
            const filteredRecent = recentFiles.filter((r) => r.id !== id);
            if (filteredRecent.length !== recentFiles.length) {
              saveRecentFiles(filteredRecent);
              set({ recentFiles: filteredRecent });
            }

            const fileTree = await fileStorageDB.buildFileTree();
            set({ fileTree });
          },
          'Delete failed'
        );
      },

      /**
       * Recursively deletes a directory and all its contents from IndexedDB.
       *
       * Closes tabs whose paths share the deleted prefix, clears `selectedFile` if it
       * resided inside the directory, removes deleted paths from `expandedDirectories`,
       * and rebuilds `fileTree` afterwards.
       */
      deleteDirectory: async (path: string) => {
        await withLoading(
          set,
          async () => {
            const { selectedFile, expandedDirectories } = get();

            await fileStorageDB.deleteDirectoryRecursive(path);
            const dirTabsState = useTabsStore.getState();
            const keptTabs = dirTabsState.tabs.filter(
              (t) =>
                !t.sourcePath || (t.sourcePath !== path && !t.sourcePath.startsWith(path + '/'))
            );
            const activeStillExists = keptTabs.some((t) => t.id === dirTabsState.activeTabId);
            dirTabsState.setTabsState(
              keptTabs,
              activeStillExists ? dirTabsState.activeTabId : (keptTabs[0]?.id ?? null),
              keptTabs.length === 0
            );

            if (selectedFile?.path.startsWith(path)) {
              set({ selectedFile: null });
            }

            const { recentFiles } = get();
            const filteredRecent = recentFiles.filter(
              (r) => r.path !== path && !r.path.startsWith(path + '/')
            );
            if (filteredRecent.length !== recentFiles.length) {
              saveRecentFiles(filteredRecent);
              set({ recentFiles: filteredRecent });
            }

            const newExpanded = new Set(expandedDirectories);
            for (const p of newExpanded) {
              if (p === path || p.startsWith(path + '/')) {
                newExpanded.delete(p);
              }
            }

            const fileTree = await fileStorageDB.buildFileTree();
            set({ fileTree, expandedDirectories: newExpanded });
          },
          'Delete failed'
        );
      },

      /**
       * Renames a file in IndexedDB and refreshes any open tabs that reference it.
       *
       * Builds the new path from the file's existing `parentPath` and the new name.
       * Rejects if another file already lives at the resulting path. Best-effort
       * propagation to the server happens afterwards via the sync service.
       */
      renameFile: async (id: string, newName: string) => {
        set({ isLoading: true, error: null });
        try {
          const trimmed = newName.trim();
          if (!trimmed) throw new Error('Name cannot be empty');

          const file = await fileStorageDB.getFile(id);
          if (!file) throw new Error('File not found');

          const ext = (() => {
            const dot = file.name.lastIndexOf('.');
            if (dot <= 0 || dot === file.name.length - 1) return '';
            return file.name.slice(dot);
          })();

          const validationMsg = validateFileName(trimmed, {
            fixedExtension: ext,
          });
          if (validationMsg) throw new Error(validationMsg);

          if (file.name === trimmed) return;

          const newPath = file.parentPath === '/' ? `/${trimmed}` : `${file.parentPath}/${trimmed}`;

          const existing = await fileStorageDB.getFileByPath(newPath);
          if (existing && existing.id !== id) {
            throw new Error('A file with that name already exists');
          }

          await fileStorageDB.renameFile(id, trimmed, newPath, file.parentPath);

          useTabsStore.getState().updateTabPath(id, newPath, trimmed);

          const { selectedFile } = get();
          if (selectedFile?.id === id) {
            set({ selectedFile: { ...selectedFile, name: trimmed, path: newPath } });
          }

          const fileTree = await fileStorageDB.buildFileTree();
          set({ fileTree });

          // Best-effort server propagation; sync will reconcile on failure.
          if (localStorage.getItem('mdhd-auth-token')) {
            import('@/services/sync/sync-service')
              .then(({ renameFileOnServer }) => renameFileOnServer(id, trimmed, newPath))
              .catch((err) => console.error('[file-store] Server rename failed:', err));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Wipes all files from IndexedDB and resets the store to its empty initial state.
       *
       * Closes all file-backed tabs (keeping any unsaved tabs) and clears
       * `fileTree`, `selectedFile`, and `expandedDirectories`.
       */
      clearAll: async () => {
        await withLoading(
          set,
          async () => {
            await fileStorageDB.clearAll();
            const clearTabsState = useTabsStore.getState();
            const localOnlyTabs = clearTabsState.tabs.filter((t) => !t.sourceFileId);
            const activeKept = localOnlyTabs.some((t) => t.id === clearTabsState.activeTabId);
            clearTabsState.setTabsState(
              localOnlyTabs,
              activeKept ? clearTabsState.activeTabId : (localOnlyTabs[0]?.id ?? null),
              localOnlyTabs.length === 0
            );
            localStorage.removeItem(RECENT_FILES_KEY);
            set({
              fileTree: [],
              selectedFile: null,
              expandedDirectories: new Set(),
              recentFiles: [],
            });
          },
          'Clear failed'
        );
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'file-store' }
  )
);

export const useFileTree = () => useFileStore((state) => state.fileTree);
export const useRecentFiles = () => useFileStore((state) => state.recentFiles);
export const useSelectedFile = () => useFileStore((state) => state.selectedFile);
export const useExpandedDirectories = () => useFileStore((state) => state.expandedDirectories);
export const useIsFileLoading = () => useFileStore((state) => state.isLoading);
export const useFileError = () => useFileStore((state) => state.error);
export const useIsFileStoreInitialized = () => useFileStore((state) => state.isInitialized);

/**
 * Hook that exposes all general-purpose file store actions.
 *
 * Uses `useShallow` to prevent re-renders when unrelated state changes. Excludes
 * upload-specific and directory-specific actions (see `useFileUpload`, `useDirectory`).
 *
 * @hook
 * @returns An object containing `initialize`, `refreshFileTree`, `selectFile`,
 *   `clearSelection`, `expandAll`, `collapseAll`, `handleDrop`, `deleteFile`,
 *   `clearAll`, and `clearError`.
 */
export const useFileStoreActions = () => {
  return useFileStore(
    useShallow((state) => ({
      initialize: state.initialize,
      refreshFileTree: state.refreshFileTree,
      selectFile: state.selectFile,
      clearSelection: state.clearSelection,
      expandAll: state.expandAll,
      collapseAll: state.collapseAll,
      handleDrop: state.handleDrop,
      deleteFile: state.deleteFile,
      renameFile: state.renameFile,
      clearAll: state.clearAll,
      clearError: state.clearError,
    }))
  );
};

/**
 * Hook that provides upload state and upload action dispatchers.
 *
 * @hook
 * @returns `isUploading`, `uploadProgress`, `uploadFiles`, and `uploadDirectory`.
 */
export function useFileUpload() {
  return useFileStore(
    useShallow(({ isUploading, uploadDirectory, uploadFiles, uploadProgress }) => {
      return {
        isUploading,
        uploadDirectory,
        uploadFiles,
        uploadProgress,
      };
    })
  );
}

/**
 * Hook that provides directory expansion state and related action dispatchers.
 *
 * @hook
 * @returns `expandedDirectories`, `expandDirectory`, `collapseDirectory`,
 *   `toggleDirectory`, and `deleteDirectory`.
 */
export function useDirectory() {
  return useFileStore(
    useShallow(
      ({
        expandDirectory,
        collapseDirectory,
        deleteDirectory,
        toggleDirectory,
        expandedDirectories,
      }) => {
        return {
          expandDirectory,
          collapseDirectory,
          deleteDirectory,
          toggleDirectory,
          expandedDirectories,
        };
      }
    )
  );
}
