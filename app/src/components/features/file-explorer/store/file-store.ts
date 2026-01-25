import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  fileStorageDB,
  processFileUpload,
  processDirectoryUpload,
  processDroppedItems,
  type FileTreeNode,
  type StoredFile,
  type UploadProgress,
} from '@/services/indexeddb';
import { useTabsStore } from '@/components/features/tabs/store/tabs-store';

interface FileStoreState {
  // Data
  fileTree: FileTreeNode[];
  selectedFile: StoredFile | null;
  expandedDirectories: Set<string>;

  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;

  // Initialization
  isInitialized: boolean;
}

interface FileStoreActions {
  // Initialization
  initialize: () => Promise<void>;

  // File tree operations
  refreshFileTree: () => Promise<void>;

  // Selection
  selectFile: (file: StoredFile) => void;
  clearSelection: () => void;

  // Directory expansion
  toggleDirectory: (path: string) => void;
  expandDirectory: (path: string) => void;
  collapseDirectory: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Upload operations
  uploadFiles: (files: File[]) => Promise<void>;
  uploadDirectory: (files: FileList) => Promise<void>;
  handleDrop: (items: DataTransferItemList) => Promise<void>;

  // Delete operations
  deleteFile: (id: string) => Promise<void>;
  deleteDirectory: (path: string) => Promise<void>;

  // Clear
  clearAll: () => Promise<void>;
  clearError: () => void;
}

/**
 * Collect all directory paths from the file tree
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

export const useFileStore = create<FileStoreState & FileStoreActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      fileTree: [],
      selectedFile: null,
      expandedDirectories: new Set<string>(),
      isLoading: false,
      isUploading: false,
      uploadProgress: null,
      error: null,
      isInitialized: false,

      // Initialize the store
      initialize: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        set({ isLoading: true, error: null });

        try {
          await fileStorageDB.init();
          const fileTree = await fileStorageDB.buildFileTree();
          set({
            fileTree,
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize',
            isLoading: false,
          });
        }
      },

      // Refresh the file tree from IndexedDB
      refreshFileTree: async () => {
        set({ isLoading: true, error: null });

        try {
          const fileTree = await fileStorageDB.buildFileTree();
          set({ fileTree, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh',
            isLoading: false,
          });
        }
      },

      // Select a file
      selectFile: (file: StoredFile) => {
        set({ selectedFile: file });
      },

      // Clear selection
      clearSelection: () => {
        set({ selectedFile: null });
      },

      // Toggle directory expansion
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

      // Expand a directory
      expandDirectory: (path: string) => {
        const { expandedDirectories } = get();
        const newExpanded = new Set(expandedDirectories);
        newExpanded.add(path);
        set({ expandedDirectories: newExpanded });
      },

      // Collapse a directory
      collapseDirectory: (path: string) => {
        const { expandedDirectories } = get();
        const newExpanded = new Set(expandedDirectories);
        newExpanded.delete(path);
        set({ expandedDirectories: newExpanded });
      },

      // Expand all directories
      expandAll: () => {
        const { fileTree } = get();
        const allPaths = collectAllDirectoryPaths(fileTree);
        set({ expandedDirectories: new Set(allPaths) });
      },

      // Collapse all directories
      collapseAll: () => {
        set({ expandedDirectories: new Set() });
      },

      // Upload files
      uploadFiles: async (files: File[]) => {
        set({ isUploading: true, uploadProgress: null, error: null });

        try {
          await processFileUpload(files, '', (progress) => {
            set({ uploadProgress: progress });
          });

          const fileTree = await fileStorageDB.buildFileTree();
          set({
            fileTree,
            isUploading: false,
            uploadProgress: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Upload failed',
            isUploading: false,
            uploadProgress: null,
          });
        }
      },

      // Upload directory
      uploadDirectory: async (files: FileList) => {
        set({ isUploading: true, uploadProgress: null, error: null });

        try {
          await processDirectoryUpload(files, (progress) => {
            set({ uploadProgress: progress });
          });

          const fileTree = await fileStorageDB.buildFileTree();

          // Auto-expand newly created directories
          const allPaths = collectAllDirectoryPaths(fileTree);
          const { expandedDirectories } = get();
          const newExpanded = new Set([...expandedDirectories, ...allPaths]);

          set({
            fileTree,
            expandedDirectories: newExpanded,
            isUploading: false,
            uploadProgress: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Upload failed',
            isUploading: false,
            uploadProgress: null,
          });
        }
      },

      // Handle drag-drop
      handleDrop: async (items: DataTransferItemList) => {
        set({ isUploading: true, uploadProgress: null, error: null });

        try {
          await processDroppedItems(items, (progress) => {
            set({ uploadProgress: progress });
          });

          const fileTree = await fileStorageDB.buildFileTree();

          // Auto-expand directories
          const allPaths = collectAllDirectoryPaths(fileTree);
          const { expandedDirectories } = get();
          const newExpanded = new Set([...expandedDirectories, ...allPaths]);

          set({
            fileTree,
            expandedDirectories: newExpanded,
            isUploading: false,
            uploadProgress: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Upload failed',
            isUploading: false,
            uploadProgress: null,
          });
        }
      },

      // Delete a file
      deleteFile: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const { selectedFile } = get();

          await fileStorageDB.deleteFile(id);

          // Close any tab associated with this file
          useTabsStore.getState().closeTabByFileId(id);

          // Clear selection if deleted file was selected
          if (selectedFile?.id === id) {
            set({ selectedFile: null });
          }

          const fileTree = await fileStorageDB.buildFileTree();
          set({ fileTree, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Delete failed',
            isLoading: false,
          });
        }
      },

      // Delete a directory recursively
      deleteDirectory: async (path: string) => {
        set({ isLoading: true, error: null });

        try {
          const { selectedFile, expandedDirectories } = get();

          await fileStorageDB.deleteDirectoryRecursive(path);

          // Close all tabs for files in this directory
          useTabsStore.getState().closeTabsByPathPrefix(path);

          // Clear selection if deleted file was in this directory
          if (selectedFile?.path.startsWith(path)) {
            set({ selectedFile: null });
          }

          // Remove from expanded directories
          const newExpanded = new Set(expandedDirectories);
          for (const p of newExpanded) {
            if (p === path || p.startsWith(path + '/')) {
              newExpanded.delete(p);
            }
          }

          const fileTree = await fileStorageDB.buildFileTree();
          set({
            fileTree,
            expandedDirectories: newExpanded,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Delete failed',
            isLoading: false,
          });
        }
      },

      // Clear all files and directories
      clearAll: async () => {
        set({ isLoading: true, error: null });

        try {
          await fileStorageDB.clearAll();
          set({
            fileTree: [],
            selectedFile: null,
            expandedDirectories: new Set(),
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Clear failed',
            isLoading: false,
          });
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'file-store' }
  )
);

// Selector hooks
export const useFileTree = () => useFileStore((state) => state.fileTree);
export const useSelectedFile = () => useFileStore((state) => state.selectedFile);
export const useExpandedDirectories = () => useFileStore((state) => state.expandedDirectories);
export const useIsFileLoading = () => useFileStore((state) => state.isLoading);
export const useFileError = () => useFileStore((state) => state.error);
export const useIsFileStoreInitialized = () => useFileStore((state) => state.isInitialized);

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
      clearAll: state.clearAll,
      clearError: state.clearError,
    }))
  );
};


export function useFileUpload() {
  return useFileStore(useShallow(({ isUploading, uploadDirectory, uploadFiles, uploadProgress }) => {
    return {
      isUploading,
      uploadDirectory,
      uploadFiles,
      uploadProgress,
    }
  }))
}

export function useDirectory() {
  return useFileStore(useShallow(({ expandDirectory, collapseDirectory, deleteDirectory, toggleDirectory, expandedDirectories }) => {
    return {
      expandDirectory,
      collapseDirectory,
      deleteDirectory,
      toggleDirectory,
      expandedDirectories,
    }
  }));
}