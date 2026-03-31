import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useToggle } from '@/hooks';

import { useFileStoreActions } from '../store/file-store';

/**
 * Provides actions for importing markdown files from remote URLs into the file store.
 *
 * Manages the import dialog open state and an `isImporting` loading flag. On success,
 * a toast notification is shown with the imported filename. On failure, an error toast
 * is shown and the error is re-thrown so callers can handle it further (e.g. keeping
 * the dialog open).
 *
 * @returns An object containing:
 * - `importDialogOpen` — whether the import URL dialog is currently open
 * - `openImportDialog` — opens the import dialog
 * - `setImportDialogOpen` — manually controls dialog open state
 * - `isImporting` — `true` while the URL fetch and file import is in progress
 * - `handleImportFromUrl` — initiates the import; shows success/error toasts
 *
 * @example
 * ```tsx
 * const { importDialogOpen, openImportDialog, handleImportFromUrl, isImporting } = useImportActions();
 *
 * // Open the dialog
 * openImportDialog();
 *
 * // Called when the user submits the import form
 * await handleImportFromUrl('https://example.com/doc.md', 'doc.md');
 * ```
 */
export function useImportActions() {
  const { importFromUrl } = useFileStoreActions();

  const {
    state: importDialogOpen,
    setTrue: openImportDialog,
    set: setImportDialogOpen,
  } = useToggle();
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Fetches and imports a markdown file from the given URL into the file store.
   *
   * Sets `isImporting` for the duration of the operation. Shows a success toast on
   * completion or an error toast on failure, then re-throws so the caller can react
   * (e.g. keeping the dialog open for correction).
   *
   * @param url - The remote URL of the markdown file to import.
   * @param filename - The display name to assign to the imported file.
   * @throws Re-throws any error from `importFromUrl` after showing the error toast.
   */
  const handleImportFromUrl = useCallback(
    async (url: string, filename: string) => {
      setIsImporting(true);
      try {
        await importFromUrl(url, filename);
        toast.success(`Imported "${filename}"`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Import failed';
        toast.error(msg);
        throw err;
      } finally {
        setIsImporting(false);
      }
    },
    [importFromUrl]
  );

  return {
    importDialogOpen,
    openImportDialog,
    setImportDialogOpen,
    isImporting,
    handleImportFromUrl,
  };
}
