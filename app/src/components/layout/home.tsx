import { useState, useCallback } from 'react';
import Header from './header';
import { FileExplorerSidebar } from '@/components/features/file-explorer';
import {
  TabbedContentArea,
  FullscreenMarkdownViewer,
  useTabsActions,
} from '@/components/features/tabs';
import type { StoredFile } from '@/services/indexeddb';

const Homepage = () => {
  const [fullscreenTabId, setFullscreenTabId] = useState<string | null>(null);
  const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();

  const handleEnterFullscreen = useCallback((tabId: string) => {
    setFullscreenTabId(tabId);
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setFullscreenTabId(null);
  }, []);

  const handleFileSelect = useCallback(
    (file: StoredFile) => {
      // Check if a tab already exists for this file
      const existingTab = findTabByFileId(file.id);

      if (existingTab) {
        // Activate existing tab
        setActiveTab(existingTab.id);
        setShowEmptyState(false);
      } else {
        // Create new tab for this file
        createTab(file.content, file.name, 'file', file.id, file.path);
      }
    },
    [createTab, setActiveTab, findTabByFileId, setShowEmptyState]
  );

  // Fullscreen mode
  if (fullscreenTabId) {
    return (
      <FullscreenMarkdownViewer
        tabId={fullscreenTabId}
        onExit={handleExitFullscreen}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-cascadia-code bg-background">
      <Header />

      {/* Spacer for fixed header - header is approximately 60px (py-3 + content) */}
      <div className="shrink-0 h-15" />

      <div className="flex flex-1 min-h-0">
        <FileExplorerSidebar
          className="w-64 border-r border-border/50 shrink-0"
          onFileSelect={handleFileSelect}
        />

        {/* Main Content Area with Tabs */}
        <TabbedContentArea onEnterFullscreen={handleEnterFullscreen} />
      </div>
    </div>
  );
};

export default Homepage;
