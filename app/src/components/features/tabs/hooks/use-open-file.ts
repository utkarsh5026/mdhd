import { useCallback } from 'react';
import { toast } from 'sonner';

import { fileStorageDB } from '@/services/indexeddb';

import { useTabsActions } from '../store/hooks';

/**
 * Opens a stored document in a tab, focusing an existing one when the file is
 * already open.
 *
 * @returns `openFile(fileId, label?)` — `label` names the file in error
 *   messages when the record turns out to be missing.
 */
export function useOpenFile() {
  const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();

  return useCallback(
    async (fileId: string, label?: string) => {
      const existing = findTabByFileId(fileId);
      if (existing) {
        setActiveTab(existing.id);
        setShowEmptyState(false);
        return;
      }

      try {
        const file = await fileStorageDB.getFile(fileId);
        if (!file) {
          toast.error(`File "${label ?? fileId}" not found — it may have been deleted`);
          return;
        }

        createTab(file.content, file.name, file.id, file.path);
        setShowEmptyState(false);
      } catch {
        toast.error(`Failed to open "${label ?? fileId}"`);
      }
    },
    [createTab, setActiveTab, findTabByFileId, setShowEmptyState]
  );
}
