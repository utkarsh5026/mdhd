import { useCallback } from 'react';

import { type Tab, useTabsStore } from '@/components/features/tabs/store';

/**
 * Provides a collection of tab-closing actions for the tab management system.
 *
 * Encapsulates all close-related operations — single tab, bulk close, directional close,
 * and filter-based close — handling active-tab resolution after each operation. Pinned
 * tabs are always preserved and cannot be closed via any of the returned actions.
 *
 * Closing a tab never deletes its backing file from IndexedDB; the file persists
 * independently and can be reopened from the explorer.
 *
 * @returns An object containing memoized close action callbacks.
 */
export function useTabClose() {
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabID = useTabsStore((state) => state.activeTabId);
  const setTabsState = useTabsStore((state) => state.setTabsState);

  /**
   * Commits a new tab list to the store.
   *
   * Resolves the active tab: if the previously active tab still exists in `newTabs`
   * it is preserved; otherwise the active tab is cleared (`null`).
   */
  const createNewTabState = useCallback(
    (newTabs: Tab[]) => {
      const activeStillExists = newTabs.some((t) => t.id === activeTabID);
      const newActiveTabId = activeStillExists ? activeTabID : null;
      setTabsState(newTabs, newActiveTabId, newTabs.length === 0);
    },
    [activeTabID, setTabsState]
  );

  const closeTab = useCallback(
    (tabID: string) => {
      const tab = tabs.find((t) => t.id === tabID);
      if (!tab || tab.pinned) return;

      const tabIndex = tabs.indexOf(tab);
      const newTabs = tabs.filter((t) => t.id !== tabID);

      let newActiveTabId: string | null = null;
      if (newTabs.length > 0) {
        if (activeTabID === tabID) {
          const newIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveTabId = newTabs[newIndex].id;
        } else {
          newActiveTabId = activeTabID;
        }
      }

      setTabsState(newTabs, newActiveTabId, newTabs.length === 0);
    },
    [activeTabID, setTabsState, tabs]
  );

  const closeAllTabs = useCallback(() => {
    const pinnedTabs = tabs.filter((t) => t.pinned);
    setTabsState(
      pinnedTabs,
      pinnedTabs.length > 0 ? pinnedTabs[0].id : null,
      pinnedTabs.length === 0
    );
  }, [tabs, setTabsState]);

  const closeOtherTabs = useCallback(
    (tabID: string) => {
      const tabToKeep = tabs.find((t) => t.id === tabID);
      if (!tabToKeep) return;
      const newTabs = tabs.filter(({ id, pinned }) => id === tabID || pinned);
      setTabsState(newTabs, tabID, false);
    },
    [tabs, setTabsState]
  );

  const closeTabsInDirection = useCallback(
    (direction: 'left' | 'right', tabID: string) => {
      const tabIndex = tabs.findIndex((t) => t.id === tabID);
      if (tabIndex === -1) return;
      const newTabs = direction === 'left' ? tabs.slice(tabIndex) : tabs.slice(0, tabIndex + 1);
      createNewTabState(newTabs);
    },
    [createNewTabState, tabs]
  );

  /**
   * Closes all tabs whose `sourcePath` matches or is nested under the given path prefix.
   * Tabs without a `sourcePath` (unsaved tabs) are unaffected.
   */
  const closeTabsByPathPrefix = useCallback(
    (pathPrefix: string) => {
      const newTabs = tabs.filter(
        (t) =>
          !t.sourcePath ||
          (t.sourcePath !== pathPrefix && !t.sourcePath.startsWith(pathPrefix + '/'))
      );
      createNewTabState(newTabs);
    },
    [createNewTabState, tabs]
  );

  const closeTabByFileId = useCallback(
    (fileID: string) => {
      const tab = tabs.find((t) => t.sourceFileId === fileID);
      if (!tab) return;
      closeTab(tab.id);
    },
    [tabs, closeTab]
  );

  return {
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    closeTabsInDirection,
    closeTabByFileId,
    closeTabsByPathPrefix,
  };
}
