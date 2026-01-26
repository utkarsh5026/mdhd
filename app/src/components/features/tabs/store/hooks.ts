import { useTabsStore } from './tabs-store';
import { useShallow } from 'zustand/react/shallow';

export const useTabs = () => useTabsStore((state) => state.tabs);
export const useActiveTabId = () => useTabsStore((state) => state.activeTabId);
export const useActiveTab = () =>
  useTabsStore((state) => state.tabs.find((t) => t.id === state.activeTabId));
export const useShowEmptyState = () => useTabsStore((state) => state.showEmptyState);
export const useTabsHasHydrated = () => useTabsStore((state) => state._hasHydrated);
export const useHeaderVisible = () => useTabsStore((state) => state.isHeaderVisible);

export const useTabsActions = () =>
  useTabsStore(
    useShallow((state) => ({
      createTab: state.createTab,
      createUntitledTab: state.createUntitledTab,
      closeTab: state.closeTab,
      setActiveTab: state.setActiveTab,
      updateTabReadingState: state.updateTabReadingState,
      updateTabContent: state.updateTabContent,
      updateTabSource: state.updateTabSource,
      getTabById: state.getTabById,
      setShowEmptyState: state.setShowEmptyState,
      findTabByFileId: state.findTabByFileId,
      closeTabsBySourceType: state.closeTabsBySourceType,
      toggleHeaderVisibility: state.toggleHeaderVisibility,
      clearPersistedTabs: state.clearPersistedTabs,
    }))
  );

export function useTabClose() {
  return useTabsStore(
    useShallow(
      ({
        closeAllTabs,
        closeOtherTabs,
        closeTabByFileId,
        closeTabsByPathPrefix,
        closeTabsBySourceType,
        closeTabsToTheLeft,
        closeTabsToTheRight,
      }) => {
        return {
          closeAllTabs,
          closeOtherTabs,
          closeTabByFileId,
          closeTabsByPathPrefix,
          closeTabsBySourceType,
          closeTabsToTheLeft,
          closeTabsToTheRight,
        };
      }
    )
  );
}
