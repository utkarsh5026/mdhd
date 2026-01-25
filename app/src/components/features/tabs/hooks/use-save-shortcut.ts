import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useTabsStore } from '../store/tabs-store';
import { fileStorageDB } from '@/services/indexeddb';
import { useFileStore } from '@/components/features/file-explorer/store/file-store';

interface UseSaveShortcutReturn {
  showSaveDialog: boolean;
  setShowSaveDialog: (show: boolean) => void;
  defaultFileName: string;
  handleSaveToFile: (fileName: string) => Promise<void>;
  isSaving: boolean;
}

export const useSaveShortcut = (): UseSaveShortcutReturn => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeTab = useTabsStore((state) =>
    state.tabs.find((t) => t.id === state.activeTabId)
  );
  const updateTabSource = useTabsStore((state) => state.updateTabSource);

  // Handle Ctrl+S
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check for Ctrl+S (or Cmd+S on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        if (!activeTab) return;

        // Don't save empty untitled tabs
        if (!activeTab.content.trim()) {
          toast.error('Cannot save empty file');
          return;
        }

        if (activeTab.sourceType === 'file' && activeTab.sourceFileId) {
          // Auto-save to existing file
          try {
            setIsSaving(true);
            await fileStorageDB.updateFile(activeTab.sourceFileId, activeTab.content);
            toast.success('File saved');
          } catch (error) {
            toast.error('Failed to save file');
            console.error('Save error:', error);
          } finally {
            setIsSaving(false);
          }
        } else {
          // Show save dialog for paste/untitled tabs
          setShowSaveDialog(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Handle saving to new file
  const handleSaveToFile = useCallback(
    async (fileName: string) => {
      if (!activeTab) return;

      setIsSaving(true);

      try {
        // Check if file already exists
        const existingFile = await fileStorageDB.getFileByPath(`/${fileName}`);
        if (existingFile) {
          throw new Error('A file with this name already exists');
        }

        // Create new file in IndexedDB
        const storedFile = await fileStorageDB.addFile({
          name: fileName,
          path: `/${fileName}`,
          parentPath: '/',
          content: activeTab.content,
          size: new Blob([activeTab.content]).size,
        });

        // Update tab to be linked to this file
        updateTabSource(activeTab.id, 'file', storedFile.id, storedFile.path);

        // Refresh file tree
        await useFileStore.getState().refreshFileTree();

        toast.success(`Saved as ${fileName}`);
      } catch (error) {
        throw error; // Re-throw so dialog can display error
      } finally {
        setIsSaving(false);
      }
    },
    [activeTab, updateTabSource]
  );

  // Generate default file name from tab title
  const defaultFileName = activeTab
    ? activeTab.title.startsWith('Untitled')
      ? 'untitled.md'
      : `${activeTab.title
          .replace(/[^a-zA-Z0-9-_\s]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase()}.md`
    : 'untitled.md';

  return {
    showSaveDialog,
    setShowSaveDialog,
    defaultFileName,
    handleSaveToFile,
    isSaving,
  };
};
