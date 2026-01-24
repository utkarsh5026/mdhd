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

interface TabbedContentAreaProps {
  onEnterFullscreen: (tabId: string) => void;
}

const TabbedContentArea: React.FC<TabbedContentAreaProps> = memo(({ onEnterFullscreen }) => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const activeTab = useActiveTab();
  const showEmptyState = useShowEmptyState();
  const { createTab, closeTab, setActiveTab, setShowEmptyState } = useTabsActions();

  const markdownInput = useReadingStore((state) => state.markdownInput);
  const initializeReading = useReadingStore((state) => state.initializeReading);
  const clearPersistedSession = useReadingStore((state) => state.clearPersistedSession);

  const handleNewTab = useCallback(() => {
    setShowEmptyState(true);
  }, [setShowEmptyState]);

  const handleStartReading = useCallback(() => {
    if (!markdownInput.trim()) return;
    createTab(markdownInput, undefined, 'paste');
    clearPersistedSession();
  }, [markdownInput, createTab, clearPersistedSession]);

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

  const shouldShowEmptyState = showEmptyState || tabs.length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Bar - only show if there are tabs */}
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs}
          activeTabId={showEmptyState ? null : activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {shouldShowEmptyState ? (
            <motion.div
              key="empty-state"
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
                onEnterFullscreen={() => onEnterFullscreen(activeTab.id)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
});

TabbedContentArea.displayName = 'TabbedContentArea';

export default TabbedContentArea;
