import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useTabsStore } from '../store/tabs-store';
import { fileStorageDB } from '@/services/indexeddb';
import { useFileStore } from '@/components/features/file-explorer/store/file-store';

/**
 * Custom hook that handles keyboard shortcut (Ctrl/Cmd + S) for saving tab content
 *
 * This hook:
 * - Listens for Ctrl/Cmd + S keyboard shortcut
 * - Saves content to existing file if tab is linked to a file
 * - Shows save dialog for new/unlinked tabs
 * - Prevents saving empty content
 * - Manages save dialog visibility and saving state
 *
 */
export function useSaveShortcut() {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeTab = useTabsStore((state) => state.tabs.find((t) => t.id === state.activeTabId));
  const updateTabSource = useTabsStore((state) => state.updateTabSource);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        if (!activeTab) return;

        if (!activeTab.content.trim()) {
          toast.error('Cannot save empty file');
          return;
        }

        if (activeTab.sourceType === 'file' && activeTab.sourceFileId) {
          try {
            setIsSaving(true);
            await fileStorageDB.updateFile(activeTab.sourceFileId, activeTab.content);
            toast.success('File saved');
          } catch {
            toast.error('Failed to save file');
          } finally {
            setIsSaving(false);
          }
          return;
        }
        setShowSaveDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  /**
   * Saves the active tab's content to a new file in IndexedDB
   *
   * @param {string} fileName - Name for the new file (without path)
   * @throws {Error} If a file with the same name already exists
   */
  const handleSaveToFile = useCallback(
    async (fileName: string) => {
      if (!activeTab) return;

      setIsSaving(true);

      try {
        const existingFile = await fileStorageDB.getFileByPath(`/${fileName}`);
        if (existingFile) {
          throw new Error('A file with this name already exists');
        }

        const storedFile = await fileStorageDB.addFile({
          name: fileName,
          path: `/${fileName}`,
          parentPath: '/',
          content: activeTab.content,
          size: new Blob([activeTab.content]).size,
        });

        updateTabSource(activeTab.id, 'file', storedFile.id, storedFile.path);
        await useFileStore.getState().refreshFileTree();

        toast.success(`Saved as ${fileName}`);
      } finally {
        setIsSaving(false);
      }
    },
    [activeTab, updateTabSource]
  );

  return {
    showSaveDialog,
    setShowSaveDialog,
    defaultFileName: getDefaultFileName(activeTab?.title || ''),
    handleSaveToFile,
    isSaving,
  };
}

/**
 * Generates a default file name from a tab title
 *
 * Rules:
 * - Preserves 'untitled' prefix with numeric suffixes (e.g., "untitled 2" → "untitled 2.md")
 * - Converts regular titles to lowercase, kebab-case format (e.g., "My File" → "my-file.md")
 * - Removes special characters (keeps only alphanumeric, hyphens, underscores)
 * - Replaces spaces with hyphens
 * - Always appends .md extension
 *
 * @param {string} title - The tab title to convert
 * @returns {string} Sanitized file name with .md extension
 *
 * @example
 * ```ts
 * getDefaultFileName("untitled 2")    // returns "untitled 2.md"
 * getDefaultFileName("My Document")   // returns "my-document.md"
 * getDefaultFileName("file@name!")    // returns "filename.md"
 * ```
 */
function getDefaultFileName(title: string): string {
  const untitled = 'untitled';
  if (!title) return `${untitled}.md`;

  if (title.startsWith(untitled) && title.length > untitled.length) {
    const suffix = title.substring(untitled.length).trim();
    return `${untitled}${suffix}.md`;
  }

  if (title.startsWith(untitled)) {
    return `${untitled}.md`;
  }

  return `${title
    .replace(/[^a-zA-Z0-9-_\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()}.md`;
}
