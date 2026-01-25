import React, { useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TabBar from './tab-bar';
import HeroMain from '@/components/layout/hero-section';
import MarkdownEditor from '@/components/layout/markdown-editor';
import {
  useTabs,
  useActiveTabId,
  useActiveTab,
  useShowEmptyState,
  useTabsActions,
} from '../store/tabs-store';
import { useReadingStore } from '@/components/features/content-reading/store/use-reading-store';
import InlineMarkdownViewer from './inline-markdown-viewer';
import { SaveFileDialog } from './save-file-dialog';
import { useSaveShortcut } from '../hooks/use-save-shortcut';

interface TabbedContentAreaProps {
  onEnterFullscreen: (tabId: string) => void;
}

const TabbedContentArea: React.FC<TabbedContentAreaProps> = memo(({ onEnterFullscreen }) => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const activeTab = useActiveTab();
  const showEmptyState = useShowEmptyState();
  const {
    createTab,
    createUntitledTab,
    closeTab,
    setActiveTab,
    setShowEmptyState,
    updateTabContent,
    updateTabReadingState,
    closeAllTabs,
    closeOtherTabs,
    closeTabsToTheRight,
    closeTabsToTheLeft,
    closeTabsByPathPrefix,
    closeTabsBySourceType,
  } = useTabsActions();

  // Get current view mode from active tab
  const viewMode = activeTab?.readingState.viewMode ?? 'preview';

  // Handle view mode toggle
  const handleViewModeToggle = useCallback(
    (mode: 'preview' | 'edit') => {
      if (activeTab) {
        updateTabReadingState(activeTab.id, { viewMode: mode });
      }
    },
    [activeTab, updateTabReadingState]
  );

  const markdownInput = useReadingStore((state) => state.markdownInput);
  const initializeReading = useReadingStore((state) => state.initializeReading);
  const clearPersistedSession = useReadingStore((state) => state.clearPersistedSession);

  // Save shortcut hook
  const { showSaveDialog, setShowSaveDialog, defaultFileName, handleSaveToFile, isSaving } =
    useSaveShortcut();

  const handleNewTab = useCallback(() => {
    createUntitledTab();
  }, [createUntitledTab]);

  const handleStartReading = useCallback(() => {
    if (!markdownInput.trim()) return;

    // If active tab is empty (untitled with no content), update its content
    if (activeTab && activeTab.content === '') {
      updateTabContent(activeTab.id, markdownInput);
    } else {
      // Create new tab (when no tabs exist or coming from initial state)
      createTab(markdownInput, undefined, 'paste');
    }
    clearPersistedSession();
  }, [markdownInput, activeTab, updateTabContent, createTab, clearPersistedSession]);

  const handleTabSelect = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      setShowEmptyState(false);
    },
    [setActiveTab, setShowEmptyState]
  );

  const handleTabClose = useCallback(
    (tabId: string) => {
      closeTab(tabId);
    },
    [closeTab]
  );

  // Check if active tab is empty (untitled with no content)
  const isActiveTabEmpty = activeTab && activeTab.content === '';

  // Show empty state UI if no tabs OR if active tab is empty
  const shouldShowEmptyState = showEmptyState || tabs.length === 0 || isActiveTabEmpty;

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-2xl">
      {/* Tab Bar - only show if there are tabs */}
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          viewMode={viewMode}
          onViewModeToggle={handleViewModeToggle}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
          onCloseAllTabs={closeAllTabs}
          onCloseOtherTabs={closeOtherTabs}
          onCloseTabsToTheRight={closeTabsToTheRight}
          onCloseTabsToTheLeft={closeTabsToTheLeft}
          onCloseTabsByPathPrefix={closeTabsByPathPrefix}
          onCloseTabsBySourceType={closeTabsBySourceType}
        />
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {shouldShowEmptyState ? (
            <motion.div
              key={isActiveTabEmpty ? `empty-tab-${activeTab?.id}` : 'empty-state'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-auto"
            >
              <div className="container mx-auto px-6 py-12">
                <HeroMain />
                <div className="max-w-3xl mx-auto">
                  <MarkdownEditor
                    markdownInput={markdownInput}
                    setMarkdownInput={initializeReading}
                    handleStartReading={handleStartReading}
                  />
                </div>
              </div>
            </motion.div>
          ) : activeTab ? (
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <InlineMarkdownViewer
                tabId={activeTab.id}
                viewMode={viewMode}
                onContentChange={(content) => updateTabContent(activeTab.id, content)}
                onEnterFullscreen={() => onEnterFullscreen(activeTab.id)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Save File Dialog */}
      <SaveFileDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        defaultFileName={defaultFileName}
        onSave={handleSaveToFile}
        isSaving={isSaving}
      />
    </div>
  );
});

TabbedContentArea.displayName = 'TabbedContentArea';

export default TabbedContentArea;
