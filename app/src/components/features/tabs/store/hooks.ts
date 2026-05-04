import { useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { selectTabById } from './tab-selectors';
import { useTabsStore } from './tabs-store';
import type { Tab } from './types';

export { useActiveTabSections } from '../hooks/use-active-tab-sections';

export const useTabs = () => useTabsStore((state) => state.tabs);
export const useActiveTabId = () => useTabsStore((state) => state.activeTabId);
export const useActiveTab = () =>
  useTabsStore((state) => state.tabs.find((t) => t.id === state.activeTabId));
export const useShowEmptyState = () => useTabsStore((state) => state.showEmptyState);
export const useHeaderVisible = () => useTabsStore((state) => state.isHeaderVisible);
export const useStatusBarVisible = () => useTabsStore((state) => state.isStatusBarVisible);

/**
 * Subscribes to a single tab by id. Re-renders when that tab's object identity
 * changes (any field update on the tab).
 */
export function useTabById(tabId: string): Tab | undefined {
  return useTabsStore((s) => selectTabById(s, tabId));
}

/**
 * Shallow subscribes to a derived snapshot from a tab — prefer this when you
 * only need a few fields and want to avoid re-renders on unrelated tab updates.
 *
 * The `slice` callback may be recreated each render; it is read via a ref so
 * the underlying Zustand selector stays stable.
 */
export function useTabSlice<T>(tabId: string, slice: (tab: Tab | undefined) => T): T {
  const sliceRef = useRef(slice);
  sliceRef.current = slice;
  return useTabsStore(useShallow((s) => sliceRef.current(selectTabById(s, tabId)) as T));
}

export const useTabsActions = () =>
  useTabsStore(
    useShallow((state) => ({
      createTab: state.createTab,
      createFromPaste: state.createFromPaste,
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
