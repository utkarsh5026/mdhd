import { useShallow } from 'zustand/react/shallow';

import { useTabsStore } from './tabs-store';

export { useActiveTabSections } from '../hooks/use-active-tab-sections';

export const useTabs = () => useTabsStore((state) => state.tabs);
export const useActiveTabId = () => useTabsStore((state) => state.activeTabId);
export const useActiveTab = () =>
  useTabsStore((state) => state.tabs.find((t) => t.id === state.activeTabId));
export const useShowEmptyState = () => useTabsStore((state) => state.showEmptyState);
export const useHeaderVisible = () => useTabsStore((state) => state.isHeaderVisible);
export const useStatusBarVisible = () => useTabsStore((state) => state.isStatusBarVisible);

export const useTabsActions = () =>
  useTabsStore(
    useShallow((state) => ({
      createTab: state.createTab,
      createUntitledTab: state.createUntitledTab,
      setActiveTab: state.setActiveTab,
      updateTabReadingState: state.updateTabReadingState,
      updateTabContent: state.updateTabContent,
      getTabById: state.getTabById,
      setShowEmptyState: state.setShowEmptyState,
      findTabByFileId: state.findTabByFileId,
      toggleHeaderVisibility: state.toggleHeaderVisibility,
      toggleStatusBarVisibility: state.toggleStatusBarVisibility,
      pinTab: state.pinTab,
      unpinTab: state.unpinTab,
      duplicateTab: state.duplicateTab,
    }))
  );
