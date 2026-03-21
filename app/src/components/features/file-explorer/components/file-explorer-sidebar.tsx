import { Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { TooltipButton } from '@/components/shared/ui/tooltip-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { FileTreeNode, StoredFile } from '@/services/indexeddb';

import {
  useDirectory,
  useExpandedDirectories,
  useFileError,
  useFileStoreActions,
  useFileTree,
  useFileUpload,
  useIsFileLoading,
  useIsFileStoreInitialized,
  useSelectedFile,
} from '../store/file-store';
import { DeleteDialog } from './actions/delete-dialog';
import { FileTree } from './file-tree/file-tree';
import { SidebarToc } from './sidebar-toc';
import { TabbedSidebar } from './tabbed-sidebar';
import { DropZone } from './upload/drop-zone';
import { UploadButton } from './upload/upload-button';
import { UploadProgressIndicator } from './upload/upload-progress';

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
  const isInitialized = useIsFileStoreInitialized();
  const isLoading = useIsFileLoading();
  const initError = useFileError();
  const { isUploading, uploadProgress, uploadDirectory, uploadFiles } = useFileUpload();
  const { toggleDirectory, deleteDirectory } = useDirectory();
  const { initialize, selectFile, handleDrop, deleteFile, clearError } = useFileStoreActions();

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
    if (initError) {
      return (
        <div className={cn('flex flex-col bg-background', className)}>
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
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
        </div>
      );
    }
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

  const filesContent = (
    <DropZone onDrop={handleDropZone} className="flex flex-col h-full overflow-y-auto">
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
  );

  return (
    <>
      <div className={cn('flex flex-col overflow-hidden bg-background', className)}>
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
              Explorer
            </span>
            <div className="flex items-center gap-0.5">
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

        {/* Tabbed content */}
        <TabbedSidebar
          filesContent={filesContent}
          tocContent={<SidebarToc />}
          className="flex-1 overflow-hidden"
        />
      </div>

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
