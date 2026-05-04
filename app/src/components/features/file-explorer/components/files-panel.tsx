import { Loader2 } from 'lucide-react';
import React, { memo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { FileTreeNode, type StoredFile } from '@/services/indexeddb';

import { useDeleteActions } from '../hooks/use-delete-actions';
import { useShareActions } from '../hooks/use-share-actions';
import {
  useDirectory,
  useFileStore,
  useFileStoreActions,
  useFileUpload,
} from '../store/file-store';
import { DeleteDialog } from './actions/delete-dialog';
import { FileTree } from './file-tree/file-tree';
import { DropZone } from './upload/drop-zone';
import { UploadButton } from './upload/upload-button';
import { UploadProgressIndicator } from './upload/upload-progress';

/** Counts total files in a file tree (excluding directories). */
function countFilesInTree(nodes: FileTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') {
      count++;
    } else if (node.children) {
      count += countFilesInTree(node.children);
    }
  }
  return count;
}

interface FilesPanelProps {
  className?: string;
  onFileSelect?: (file: StoredFile) => void;
}

const FilesPanel: React.FC<FilesPanelProps> = memo(({ className, onFileSelect }) => {
  const { fileTree, selectedFile, expandedDirectories, isInitialized, isLoading, initError } =
    useFileStore(
      useShallow((s) => ({
        fileTree: s.fileTree,
        selectedFile: s.selectedFile,
        expandedDirectories: s.expandedDirectories,
        isInitialized: s.isInitialized,
        isLoading: s.isLoading,
        initError: s.error,
      }))
    );
  const { isUploading, uploadProgress, uploadDirectory, uploadFiles } = useFileUpload();
  const { initialize, selectFile, handleDrop, clearError } = useFileStoreActions();
  const { toggleDirectory } = useDirectory();

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    nodeToDelete,
    handleRequestDelete,
    handleConfirmDelete,
  } = useDeleteActions();

  const { shareTokens, handleShare, handleRevoke } = useShareActions();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const uploadedFileCount = countFilesInTree(fileTree);

  if (!isInitialized) {
    if (initError) {
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center flex-1 gap-3 px-4 text-center',
            className
          )}
        >
          <p className="text-sm text-destructive">{initError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearError();
              initialize();
            }}
          >
            Retry
          </Button>
        </div>
      );
    }
    return (
      <div className={cn('flex items-center justify-center flex-1', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
        <div className="px-3 py-1.5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
              Explorer
            </span>
            <div className="flex items-center gap-0.5">
              <UploadButton
                variant="files"
                onUpload={(files) => uploadFiles(Array.from(files))}
                disabled={isUploading}
              />
              <UploadButton variant="directory" onUpload={uploadDirectory} disabled={isUploading} />
            </div>
          </div>
        </div>

        {isUploading && uploadProgress && (
          <>
            <UploadProgressIndicator progress={uploadProgress} />
            <Separator />
          </>
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-accent text-foreground font-medium">
              Files
              {uploadedFileCount > 0 && (
                <span className="ml-1 text-[10px] opacity-60">{uploadedFileCount}</span>
              )}
            </span>
          </div>

          <DropZone onDrop={handleDrop} className="flex flex-col flex-1 overflow-y-auto">
            {isLoading && !isUploading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fileTree.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 px-3 py-4 text-center">
                Drop files here, paste with Ctrl+Shift+V, or use the upload buttons
              </p>
            ) : (
              <FileTree
                nodes={fileTree}
                selectedPath={selectedFile?.path || null}
                expandedPaths={expandedDirectories}
                onFileClick={(file) => {
                  selectFile(file);
                  onFileSelect?.(file);
                }}
                onDirectoryToggle={toggleDirectory}
                onDelete={handleRequestDelete}
                onShare={handleShare}
                onRevoke={handleRevoke}
                shareTokens={shareTokens}
              />
            )}
          </DropZone>
        </div>
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        node={nodeToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isLoading}
      />
    </>
  );
});

FilesPanel.displayName = 'FilesPanel';
export default FilesPanel;
