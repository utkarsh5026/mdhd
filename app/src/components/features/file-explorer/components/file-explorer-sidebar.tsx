import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { DropZone } from './upload/drop-zone';
import { UploadButton } from './upload/upload-button';
import { UploadProgressIndicator } from './upload/upload-progress';
import { FileTree } from './file-tree/file-tree';
import { DeleteDialog } from './actions/delete-dialog';
import { Separator } from '@/components/ui/separator';
import {
  useFileTree,
  useSelectedFile,
  useExpandedDirectories,
  useIsUploading,
  useUploadProgress,
  useFileStoreActions,
  useIsFileStoreInitialized,
  useIsFileLoading,
} from '../store/file-store';
import type { FileTreeNode, StoredFile } from '@/services/indexeddb';
import { Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipButton } from '@/components/shared/ui/tooltip-button';

interface FileExplorerSidebarProps {
  className?: string;
  onFileSelect?: (file: StoredFile) => void;
}

export const FileExplorerSidebar: React.FC<FileExplorerSidebarProps> = ({
  className,
  onFileSelect,
}) => {
  const fileTree = useFileTree();
  const selectedFile = useSelectedFile();
  const expandedDirectories = useExpandedDirectories();
  const isUploading = useIsUploading();
  const uploadProgress = useUploadProgress();
  const isInitialized = useIsFileStoreInitialized();
  const isLoading = useIsFileLoading();

  const {
    initialize,
    selectFile,
    toggleDirectory,
    uploadFiles,
    uploadDirectory,
    handleDrop,
    deleteFile,
    deleteDirectory,
  } = useFileStoreActions();

  const [isOpen, setIsOpen] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<FileTreeNode | null>(null);

  // Initialize the store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const handleFileClick = (file: StoredFile) => {
    selectFile(file);
    onFileSelect?.(file);
  };

  const handleDeleteNode = (node: FileTreeNode) => {
    setNodeToDelete(node);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!nodeToDelete) return;

    if (nodeToDelete.type === 'file') {
      await deleteFile(nodeToDelete.id);
    } else {
      await deleteDirectory(nodeToDelete.path);
    }

    setDeleteDialogOpen(false);
    setNodeToDelete(null);
  };

  const handleFilesUpload = (files: FileList) => {
    uploadFiles(Array.from(files));
  };

  const handleDirectoryUpload = (files: FileList) => {
    uploadDirectory(files);
  };

  const handleDropZone = (items: DataTransferItemList) => {
    handleDrop(items);
  };

  if (!isInitialized) {
    return (
      <div className={cn('flex flex-col bg-background', className)}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className={cn('flex flex-col items-center bg-background py-2', className, 'w-10')}>
        <TooltipButton
          button={
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(true)}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          }
          tooltipText="Open sidebar"
        />
      </div>
    );
  }

  return (
    <>
      <DropZone
        onDrop={handleDropZone}
        className={cn('flex flex-col overflow-y-auto bg-background', className)}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Files</h2>
            <div className="flex items-center gap-1">
              <UploadButton variant="files" onUpload={handleFilesUpload} disabled={isUploading} />
              <UploadButton
                variant="directory"
                onUpload={handleDirectoryUpload}
                disabled={isUploading}
              />
              <TooltipButton
                button={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsOpen(false)}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                }
                tooltipText="Close sidebar"
              />
            </div>
          </div>
        </div>

        {/* Upload progress */}
        {isUploading && uploadProgress && (
          <>
            <UploadProgressIndicator progress={uploadProgress} />
            <Separator />
          </>
        )}

        {/* File tree */}
        {isLoading && !isUploading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <FileTree
            nodes={fileTree}
            selectedPath={selectedFile?.path || null}
            expandedPaths={expandedDirectories}
            onFileClick={handleFileClick}
            onDirectoryToggle={toggleDirectory}
            onDelete={handleDeleteNode}
          />
        )}
      </DropZone>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        node={nodeToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isLoading}
      />
    </>
  );
};
