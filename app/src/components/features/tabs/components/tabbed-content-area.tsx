import React, { memo, useCallback } from 'react';

import EmptyState from '@/components/layout/empty-state';
import WelcomeScreen from '@/components/layout/welcome-screen';
import { fileStorageDB, type FileTreeNode } from '@/services/indexeddb';

import { useSaveShortcut } from '../hooks/use-save-shortcut';
import {
  useActiveTab,
  useActiveTabId,
  useShowEmptyState,
  useTabs,
  useTabsActions,
  type ViewMode,
} from '../store';
import InlineMarkdownViewer from './markdown/inline-markdown-viewer';
import { SaveFileDialog } from './save-file-dialog';
import TabBar from './tab-bar/tab-bar';

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
    findTabByFileId,
    updateTabContent,
    updateTabContentPreservePosition,
    updateTabReadingState,
    toggleHeaderVisibility,
    toggleStatusBarVisibility,
  } = useTabsActions();

  const viewMode = activeTab?.readingState.viewMode ?? 'preview';

  const handleViewModeToggle = useCallback(
    (mode: ViewMode) => {
      if (activeTab) {
        updateTabReadingState(activeTab.id, { viewMode: mode });
      }
    },
    [activeTab, updateTabReadingState]
  );

  const { showSaveDialog, setShowSaveDialog, defaultFileName, handleSaveToFile, isSaving } =
    useSaveShortcut();

  const handleNewTab = useCallback(() => {
    createUntitledTab();
  }, [createUntitledTab]);

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

  const isActiveTabEmpty = activeTab && activeTab.content === '' && activeTab.sourceType !== 'file';

  const noTabs = tabs.length === 0;
  const shouldShowEmptyState = showEmptyState || noTabs || isActiveTabEmpty;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
          onToggleHeaderVisibility={toggleHeaderVisibility}
          onToggleStatusBarVisibility={toggleStatusBarVisibility}
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
              viewMode={viewMode}
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
