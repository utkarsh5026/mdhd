import { useState, useCallback, lazy, Suspense } from 'react';
import Header from './header';
import { FileExplorerSidebar } from '@/components/features/file-explorer';
import { TabbedContentArea, useTabsActions, useHeaderVisible } from '@/components/features/tabs';
import type { StoredFile } from '@/services/indexeddb';

const FullscreenMarkdownViewer = lazy(
  () => import('@/components/features/tabs/components/markdown/fullscreen-markdown-viewer')
);

const Homepage = () => {
  const [fullscreenTabId, setFullscreenTabId] = useState<string | null>(null);
  const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();
  const isHeaderVisible = useHeaderVisible();

  const handleEnterFullscreen = useCallback((tabId: string) => {
    setFullscreenTabId(tabId);
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setFullscreenTabId(null);
  }, []);

  const handleFileSelect = useCallback(
    (file: StoredFile) => {
      const existingTab = findTabByFileId(file.id);

      if (existingTab) {
        setActiveTab(existingTab.id);
        setShowEmptyState(false);
      } else {
        createTab(file.content, file.name, 'file', file.id, file.path);
      }
    },
    [createTab, setActiveTab, findTabByFileId, setShowEmptyState]
  );

  if (fullscreenTabId) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="text-sm text-muted-foreground">Loading fullscreen view...</p>
            </div>
          </div>
        }
      >
        <FullscreenMarkdownViewer tabId={fullscreenTabId} onExit={handleExitFullscreen} />
      </Suspense>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-cascadia-code bg-card">
      {isHeaderVisible && <Header />}

      {isHeaderVisible && <div className="shrink-0 h-15" />}
      <div className="relative flex flex-1 min-h-0 p-2 gap-2">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 50%)',
          }}
        />

        <FileExplorerSidebar className="w-64 rounded-2xl" onFileSelect={handleFileSelect} />

        {/* Main Content Area with Tabs */}
        <TabbedContentArea onEnterFullscreen={handleEnterFullscreen} />
      </div>
    </div>
  );
};

export default Homepage;
