import { lazy, Suspense, useCallback, useState } from 'react';

import {
  TabbedContentArea,
  useHeaderVisible,
  useStatusBarVisible,
  useTabsActions,
} from '@/components/features/tabs';
import { ReactErrorBoundary } from '@/components/utils';
import { useLocalStorage } from '@/hooks';
import type { StoredFile } from '@/services/indexeddb';

import Header from './header';
import Sidebar, { type SidebarPosition } from './sidebar';
import StatusBar from './status-bar';

const SIDEBAR_POSITION_KEY = 'mdhd-sidebar-position';

const FullscreenMarkdownViewer = lazy(
  () => import('@/components/features/tabs/components/markdown/fullscreen-markdown-viewer')
);

const Homepage = () => {
  const [fullscreenTabId, setFullscreenTabId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();
  const isHeaderVisible = useHeaderVisible();
  const isStatusBarVisible = useStatusBarVisible();
  const { storedValue: sidebarPosition, setValue: setSidebarPosition } =
    useLocalStorage<SidebarPosition>(SIDEBAR_POSITION_KEY, 'left');

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

      setMobileSidebarOpen(false);
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
      {isHeaderVisible && <Header onToggleSidebar={() => setMobileSidebarOpen((o) => !o)} />}

      {isHeaderVisible && <div className="shrink-0 h-12 border-b border-border/20" />}
      <div className="relative flex flex-1 min-h-0">
        {sidebarPosition === 'left' && (
          <ReactErrorBoundary>
            <Sidebar
              className="border-r border-border/40"
              onFileSelect={handleFileSelect}
              position={sidebarPosition}
              onPositionChange={setSidebarPosition}
              isMobileOpen={mobileSidebarOpen}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
          </ReactErrorBoundary>
        )}

        {/* Main Content Area with Tabs */}
        <ReactErrorBoundary>
          <TabbedContentArea onEnterFullscreen={handleEnterFullscreen} />
        </ReactErrorBoundary>

        {sidebarPosition === 'right' && (
          <ReactErrorBoundary>
            <Sidebar
              className="border-l border-border/40"
              onFileSelect={handleFileSelect}
              position={sidebarPosition}
              onPositionChange={setSidebarPosition}
              isMobileOpen={mobileSidebarOpen}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
          </ReactErrorBoundary>
        )}
      </div>

      {isStatusBarVisible && <StatusBar />}
    </div>
  );
};

export default Homepage;
