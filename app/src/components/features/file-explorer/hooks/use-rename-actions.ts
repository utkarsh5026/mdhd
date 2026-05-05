import { useCallback, useState } from 'react';

import { useToggle } from '@/hooks';
import { type FileTreeNode } from '@/services/indexeddb';

import { useFileStoreActions } from '../store/file-store';

/**
 * Provides rename action handlers for tree-based files.
 *
 * Mirrors {@link useDeleteActions}: `handleRequestRename` stages a node and opens
 * the rename dialog; `handleConfirmRename` performs the rename and surfaces any
 * resulting error inline so the dialog can display it without closing.
 *
 * Directory renaming is intentionally unsupported here — only files for now.
 */
export function useRenameActions() {
  const { renameFile } = useFileStoreActions();

  const {
    state: renameDialogOpen,
    setTrue: openRenameDialog,
    setFalse: closeRenameDialog,
    set: setRenameDialogOpen,
  } = useToggle();
  const [nodeToRename, setNodeToRename] = useState<FileTreeNode | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRequestRename = useCallback(
    (node: FileTreeNode) => {
      if (node.type !== 'file') return;
      setNodeToRename(node);
      setRenameError(null);
      openRenameDialog();
    },
    [openRenameDialog]
  );

  const handleConfirmRename = useCallback(
    async (newName: string) => {
      if (!nodeToRename) return;
      setIsRenaming(true);
      setRenameError(null);
      try {
        await renameFile(nodeToRename.id, newName);
        closeRenameDialog();
        setNodeToRename(null);
      } catch (err) {
        setRenameError(err instanceof Error ? err.message : 'Rename failed');
      } finally {
        setIsRenaming(false);
      }
    },
    [nodeToRename, renameFile, closeRenameDialog]
  );

  return {
    renameDialogOpen,
    setRenameDialogOpen,
    nodeToRename,
    renameError,
    isRenaming,
    handleRequestRename,
    handleConfirmRename,
  };
}
