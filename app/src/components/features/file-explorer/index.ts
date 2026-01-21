// Main component
export { FileExplorerSidebar } from './components/file-explorer-sidebar';

// Store
export {
  useFileStore,
  useFileTree,
  useSelectedFile,
  useExpandedDirectories,
  useIsFileLoading,
  useIsUploading,
  useUploadProgress,
  useFileError,
  useIsFileStoreInitialized,
  useFileStoreActions,
} from './store/file-store';

// Types (re-export from indexeddb)
export type { FileTreeNode, StoredFile, StoredDirectory, UploadProgress } from '@/services/indexeddb';
