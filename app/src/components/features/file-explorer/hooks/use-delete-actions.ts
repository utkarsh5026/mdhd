import { useCallback, useState } from 'react';

import { useToggle } from '@/hooks';
import { type FileTreeNode } from '@/services/indexeddb';

import { useDirectory, useFileStoreActions } from '../store/file-store';

/**
 * Provides delete action handlers for tree-based files and directories.
 *
 * Manages a two-step confirmation flow: `handleRequestDelete` stages a node and
 * opens the confirmation dialog; `handleConfirmDelete` performs the deletion and
 * closes the dialog.
 */
export function useDeleteActions() {
  const { deleteDirectory } = useDirectory();
  const { deleteFile } = useFileStoreActions();

  const {
    state: deleteDialogOpen,
    setTrue: openDeleteDialog,
    setFalse: closeDeleteDialog,
    set: setDeleteDialogOpen,
  } = useToggle();
  const [nodeToDelete, setNodeToDelete] = useState<FileTreeNode | null>(null);

  const handleRequestDelete = useCallback(
    (node: FileTreeNode) => {
      setNodeToDelete(node);
      openDeleteDialog();
    },
    [openDeleteDialog]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!nodeToDelete) return;
    if (nodeToDelete.type === 'file') {
      await deleteFile(nodeToDelete.id);
    } else {
      await deleteDirectory(nodeToDelete.path);
    }
    closeDeleteDialog();
    setNodeToDelete(null);
  }, [nodeToDelete, deleteFile, deleteDirectory, closeDeleteDialog]);

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    nodeToDelete,
    handleRequestDelete,
    handleConfirmDelete,
  };
}
