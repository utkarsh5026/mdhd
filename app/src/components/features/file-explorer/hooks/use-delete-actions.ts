import { useCallback, useState } from 'react';

import { useToggle } from '@/hooks';
import { fileStorageDB, type FileTreeNode } from '@/services/indexeddb';

import { useDirectory, useFileStoreActions } from '../store/file-store';

/**
 * Provides delete action handlers for both tree-based files/directories and paste files.
 *
 * Manages a two-step confirmation flow for tree node deletions (request → confirm dialog),
 * and immediate deletion for paste files stored directly in IndexedDB. Batch deletion
 * of paste files is performed in parallel via `Promise.all`.
 *
 * @returns An object containing:
 * - `deleteDialogOpen` — whether the delete confirmation dialog is open
 * - `setDeleteDialogOpen` — manually controls dialog open state
 * - `nodeToDelete` — the `FileTreeNode` staged for deletion, or `null` if none
 * - `handleRequestDelete` — stages a node and opens the confirmation dialog
 * - `handleConfirmDelete` — executes the deletion for the staged node and closes the dialog
 * - `handleDeletePasteFile` — deletes a single paste file from IndexedDB by ID
 * - `handleBatchDeletePasteFiles` — deletes multiple paste files from IndexedDB in parallel
 *
 * @example
 * ```tsx
 * const { deleteDialogOpen, handleRequestDelete, handleConfirmDelete } = useDeleteActions();
 *
 * // Stage a node for deletion (opens dialog)
 * handleRequestDelete(node);
 *
 * // Called when the user confirms in the dialog
 * await handleConfirmDelete();
 * ```
 */
export function useDeleteActions() {
  const { deleteDirectory } = useDirectory();
  const { deleteFile, refreshPasteFiles } = useFileStoreActions();

  const {
    state: deleteDialogOpen,
    setTrue: openDeleteDialog,
    setFalse: closeDeleteDialog,
    set: setDeleteDialogOpen,
  } = useToggle();
  const [nodeToDelete, setNodeToDelete] = useState<FileTreeNode | null>(null);

  /** Stages `node` for deletion and opens the confirmation dialog. */
  const handleRequestDelete = useCallback(
    (node: FileTreeNode) => {
      setNodeToDelete(node);
      openDeleteDialog();
    },
    [openDeleteDialog]
  );

  /**
   * Executes the deletion for the currently staged node.
   *
   * Dispatches to either `deleteFile` (for `'file'` nodes) or `deleteDirectory`
   * (for directory nodes), then closes the dialog and clears the staged node.
   * No-ops if no node is staged.
   */
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

  /**
   * Deletes a single paste file from IndexedDB and refreshes the paste files list.
   *
   * @param id - The IndexedDB record ID of the paste file to delete.
   */
  const handleDeletePasteFile = useCallback(
    async (id: string) => {
      await fileStorageDB.deleteFile(id);
      await refreshPasteFiles();
    },
    [refreshPasteFiles]
  );

  /**
   * Deletes multiple paste files from IndexedDB in parallel, then refreshes the paste files list.
   *
   * @param ids - Array of IndexedDB record IDs for the paste files to delete.
   */
  const handleBatchDeletePasteFiles = useCallback(
    async (ids: string[]) => {
      await Promise.allSettled(ids.map((id) => fileStorageDB.deleteFile(id)));
      await refreshPasteFiles();
    },
    [refreshPasteFiles]
  );

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    nodeToDelete,
    handleRequestDelete,
    handleConfirmDelete,
    handleDeletePasteFile,
    handleBatchDeletePasteFiles,
  };
}
