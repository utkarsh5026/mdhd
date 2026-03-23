import React, { memo, useCallback } from 'react';

import EmptyState from '@/components/layout/empty-state';
import WelcomeScreen from '@/components/layout/welcome-screen';
import { fileStorageDB, type FileTreeNode } from '@/services/indexeddb';

import { useSaveShortcut } from '../hooks/use-save-shortcut';
import { useActiveTab, useShowEmptyState, useTabs, useTabsActions } from '../store';
import InlineMarkdownViewer from './markdown/inline-markdown-viewer';
import { SaveFileDialog } from './save-file-dialog';
import TabBar from './tab-bar/tab-bar';

interface TabbedContentAreaProps {
  onEnterFullscreen: (tabId: string) => void;
}

const TabbedContentArea: React.FC<TabbedContentAreaProps> = memo(({ onEnterFullscreen }) => {
  const tabs = useTabs();
  const activeTab = useActiveTab();
  const showEmptyState = useShowEmptyState();
  const {
    createTab,
    setActiveTab,
    setShowEmptyState,
    findTabByFileId,
    updateTabContent,
    updateTabContentPreservePosition,
    updateTabReadingState,
  } = useTabsActions();

  const { showSaveDialog, setShowSaveDialog, defaultFileName, handleSaveToFile, isSaving } =
    useSaveShortcut();

  const handleStartReading = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      if (activeTab && activeTab.content === '') {
        updateTabContent(activeTab.id, content);
      } else {
        createTab(content, undefined, 'paste');
      }
    },
    [activeTab, updateTabContent, createTab]
  );

  const handleFileNodeOpen = useCallback(
    async (node: FileTreeNode) => {
      const existing = findTabByFileId(node.id);
      if (existing) {
        setActiveTab(existing.id);
        setShowEmptyState(false);
        return;
      }
      const file = await fileStorageDB.getFile(node.id);
      if (file) createTab(file.content, file.name, 'file', file.id, file.path);
    },
    [findTabByFileId, setActiveTab, setShowEmptyState, createTab]
  );

  const activeReadingState = activeTab?.readingState;
  const navCurrentIndex = activeReadingState?.currentIndex ?? 0;
  const navTotal = activeReadingState?.sections.length ?? 0;
  const navReadingMode = activeReadingState?.readingMode ?? 'card';

  const handleNavPrevious = useCallback(() => {
    if (activeTab && navCurrentIndex > 0) {
      updateTabReadingState(activeTab.id, { currentIndex: navCurrentIndex - 1 });
    }
  }, [activeTab, navCurrentIndex, updateTabReadingState]);

  const handleNavNext = useCallback(() => {
    if (activeTab && navCurrentIndex < navTotal - 1) {
      updateTabReadingState(activeTab.id, { currentIndex: navCurrentIndex + 1 });
    }
  }, [activeTab, navCurrentIndex, navTotal, updateTabReadingState]);

  const isActiveTabEmpty = activeTab && activeTab.content === '' && activeTab.sourceType !== 'file';

  const noTabs = tabs.length === 0;
  const shouldShowEmptyState = showEmptyState || noTabs || isActiveTabEmpty;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Bar - only show if there are tabs */}
      {tabs.length > 0 && (
        <TabBar
          mobileNav={
            activeTab
              ? {
                  currentIndex: navCurrentIndex,
                  total: navTotal,
                  readingMode: navReadingMode,
                  onPrevious: handleNavPrevious,
                  onNext: handleNavNext,
                  onFullscreen: () => onEnterFullscreen(activeTab.id),
                }
              : undefined
          }
        />
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {shouldShowEmptyState ? (
          noTabs ? (
            <div key="welcome" className="h-full animate-fade-in">
              <WelcomeScreen
                onStartReading={handleStartReading}
                onFileNodeOpen={handleFileNodeOpen}
              />
            </div>
          ) : (
            <div
              key={isActiveTabEmpty ? `empty-tab-${activeTab?.id}` : 'empty-state'}
              className="h-full animate-fade-in"
            >
              <EmptyState onStartReading={handleStartReading} />
            </div>
          )
        ) : activeTab ? (
          <div key={activeTab.id} className="h-full animate-fade-in-fast">
            <InlineMarkdownViewer
              tabId={activeTab.id}
              viewMode="preview"
              onContentChange={(content) => updateTabContentPreservePosition(activeTab.id, content)}
              onEnterFullscreen={() => onEnterFullscreen(activeTab.id)}
            />
          </div>
        ) : null}
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
