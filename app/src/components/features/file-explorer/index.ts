export { FileExplorerSidebar } from './components/file-explorer-sidebar';

export {
  useFileStore,
  useFileTree,
  useSelectedFile,
  useExpandedDirectories,
  useIsFileLoading,
  useFileError,
  useIsFileStoreInitialized,
  useFileStoreActions,
} from './store/file-store';


export type {
  FileTreeNode,
  StoredFile,
  StoredDirectory,
  UploadProgress,
} from '@/services/indexeddb';
