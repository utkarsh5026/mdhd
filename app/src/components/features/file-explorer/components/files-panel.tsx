import { FileUp, Loader2, Upload } from 'lucide-react';
import React, { memo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { FileTreeNode, type StoredFile } from '@/services/indexeddb';

import { useDeleteActions } from '../hooks/use-delete-actions';
import { useRenameActions } from '../hooks/use-rename-actions';
import { useShareActions } from '../hooks/use-share-actions';
import {
  useDirectory,
  useFileStore,
  useFileStoreActions,
  useFileUpload,
} from '../store/file-store';
import { DeleteDialog } from './actions/delete-dialog';
import { RenameDialog } from './actions/rename-dialog';
import { FileTree } from './file-tree/file-tree';
import { RecentFilesSection } from './recent-files';
import { DropZone } from './upload/drop-zone';
import { UploadButton } from './upload/upload-button';
import { UploadProgressIndicator } from './upload/upload-progress';

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

  const {
    renameDialogOpen,
    setRenameDialogOpen,
    nodeToRename,
    renameError,
    isRenaming,
    handleRequestRename,
    handleConfirmRename,
  } = useRenameActions();

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
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileUp className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
                Explorer
              </span>
            </div>
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

        {/* Recent files */}
        <RecentFilesSection
          selectedFilePath={selectedFile?.path ?? null}
          onFileSelect={onFileSelect}
        />

        {/* Files section */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/25">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 select-none">
              Files
            </span>
            {uploadedFileCount > 0 && (
              <span className="text-[10px] text-muted-foreground/40 font-medium bg-muted/40 px-1.5 py-0.5 rounded-full leading-none">
                {uploadedFileCount}
              </span>
            )}
          </div>

          <DropZone onDrop={handleDrop} className="flex flex-col flex-1 overflow-y-auto">
            {isLoading && !isUploading ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : fileTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 px-4 py-8 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
                  <Upload className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground/50">No files yet</p>
                  <p className="text-[11px] text-muted-foreground/35 leading-relaxed">
                    Drop files here, paste with{' '}
                    <kbd className="font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded">
                      Ctrl+Shift+V
                    </kbd>
                    , or use the buttons above
                  </p>
                </div>
              </div>
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
                onRename={handleRequestRename}
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

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        node={nodeToRename}
        onConfirm={handleConfirmRename}
        isRenaming={isRenaming}
        error={renameError}
      />
    </>
  );
});

FilesPanel.displayName = 'FilesPanel';
export default FilesPanel;
