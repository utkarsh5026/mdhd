import { useCallback, useState } from 'react';

import { useTabClose } from '@/components/features/tabs/hooks/use-tab-close';
import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import { tabIdFromPastePath } from '@/services/sync/paste-persistence';

import type { PasteFileMetadata } from '../store/file-store';

/**
 * Manages all interaction logic for the paste files list UI.
 *
 * Encapsulates selection state, delete confirmation flow, and tab-open behaviour
 * so that `PasteFilesList` remains a pure rendering component. Closing open tabs
 * on delete is handled automatically — callers only need to provide the storage
 * delete callbacks.
 *
 * @param files - The current list of paste file metadata to operate on.
 * @param onDelete - Callback that removes a single file from storage by its id.
 * @param onBatchDelete - Callback that removes multiple files from storage by their ids.
 * @returns State values and event handlers to wire directly into the list UI.
 */
export function usePasteFilesList(
  files: PasteFileMetadata[],
  onDelete: (id: string) => Promise<void>,
  onBatchDelete: (ids: string[]) => Promise<void>
) {
  const [deleteTarget, setDeleteTarget] = useState<PasteFileMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { closeTab } = useTabClose();
  const openPasteTab = useTabsStore((s) => s.openPasteTab);

  /** Opens the paste file in a tab, or switches to it if already open. */
  const handleFileClick = useCallback(
    async (file: PasteFileMetadata) => {
      const tabId = tabIdFromPastePath(file.path);
      if (!tabId) return;
      await openPasteTab(tabId, file.id, file.name, file.createdAt);
    },
    [openPasteTab]
  );

  /**
   * Confirms deletion of `deleteTarget`, closing its tab first if open.
   * Resets `deleteTarget` and `isDeleting` when done regardless of outcome.
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const tabId = tabIdFromPastePath(deleteTarget.path);
      if (tabId) closeTab(tabId);
      await onDelete(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDelete, closeTab]);

  /**
   * Deletes all currently selected files, closing any open tabs for them first.
   * Clears the selection on success.
   */
  const handleBatchDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      files
        .filter((f) => selectedIds.has(f.id))
        .map(({ path }) => tabIdFromPastePath(path))
        .filter((tabId) => tabId !== null)
        .forEach(closeTab);

      await onBatchDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, files, onBatchDelete, closeTab]);

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === files.length ? new Set() : new Set(files.map(({ id }) => id))
    );
  }, [files]);

  return {
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    selectedIds,
    handleFileClick,
    handleConfirmDelete,
    handleBatchDelete,
    toggleSelect,
    toggleSelectAll,
  };
}
