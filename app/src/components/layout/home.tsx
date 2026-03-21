import { lazy, Suspense, useCallback, useState } from 'react';

import { FileExplorerSidebar } from '@/components/features/file-explorer';
import {
  TabbedContentArea,
  useHeaderVisible,
  useStatusBarVisible,
  useTabsActions,
} from '@/components/features/tabs';
import { ReactErrorBoundary } from '@/components/utils';
import type { StoredFile } from '@/services/indexeddb';

import Header from './header';
import StatusBar from './status-bar';

const FullscreenMarkdownViewer = lazy(
  () => import('@/components/features/tabs/components/markdown/fullscreen-markdown-viewer')
);

const Homepage = () => {
  const [fullscreenTabId, setFullscreenTabId] = useState<string | null>(null);
  const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();
  const isHeaderVisible = useHeaderVisible();
  const isStatusBarVisible = useStatusBarVisible();

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

      {isHeaderVisible && <div className="shrink-0 h-12 border-b border-border/20" />}
      <div className="relative flex flex-1 min-h-0">
        <ReactErrorBoundary>
          <FileExplorerSidebar
            className="w-64 border-r border-border/40"
            onFileSelect={handleFileSelect}
          />
        </ReactErrorBoundary>

        {/* Main Content Area with Tabs */}
        <ReactErrorBoundary>
          <TabbedContentArea onEnterFullscreen={handleEnterFullscreen} />
        </ReactErrorBoundary>
      </div>

      {isStatusBarVisible && <StatusBar />}
    </div>
  );
};

export default Homepage;
