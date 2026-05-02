import { useCallback } from 'react';

import { type Tab, useTabsStore } from '@/components/features/tabs/store';
import { removePaste } from '@/services/sync/paste-persistence';

/**
 * Provides a collection of tab-closing actions for the tab management system.
 *
 * Encapsulates all close-related operations — single tab, bulk close, directional close,
 * and filter-based close — while handling associated side effects such as removing persisted
 * paste data and correctly resolving the active tab after each operation. Pinned tabs are
 * always preserved and cannot be closed via any of the returned actions.
 *
 * @returns An object containing memoized close action callbacks.
 *
 * @example
 * const { closeTab, closeAllTabs, closeOtherTabs } = useTabClose();
 * closeTab(tab.id);           // close a single tab
 * closeOtherTabs(tab.id);     // close every unpinned tab except the given one
 * closeAllTabs();             // close all unpinned tabs
 */
export function useTabClose() {
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabID = useTabsStore((state) => state.activeTabId);
  const setTabsState = useTabsStore((state) => state.setTabsState);

  /**
   * Cleans up persisted paste data for the given tabs.
   *
   * @param tabs - The tabs whose paste persistence entries should be removed.
   */
  const removeTabPastes = useCallback((tabs: Tab[]) => {
    tabs.forEach((t) => removePaste(t.id, t.sourceType));
  }, []);

  /**
   * Commits a new tab list to the store and removes paste data for any tabs
   * that are no longer present.
   *
   * Resolves the active tab: if the previously active tab still exists in `newTabs`
   * it is preserved; otherwise the active tab is cleared (`null`).
   *
   * @param newTabs - The desired tab list after the close operation.
   */
  const createNewTabState = useCallback(
    (newTabs: Tab[]) => {
      const activeStillExists = newTabs.some((t) => t.id === activeTabID);
      const newActiveTabId = activeStillExists ? activeTabID : null;
      const newShowEmptyState = newTabs.length === 0;

      const tabsToRemove = tabs.filter((t) => newTabs.find((nt) => nt.id === t.id));

      setTabsState(newTabs, newActiveTabId, newShowEmptyState);
      removeTabPastes(tabsToRemove);
    },
    [activeTabID, removeTabPastes, setTabsState, tabs]
  );

  /**
   * Closes a single tab by its ID, preserving pinned tabs and the active tab
   * unless the closed tab was the active one.
   *
   * If the closed tab is pinned, the operation is a no-op. Otherwise, the tab
   * is removed, and the active tab is adjusted to the nearest neighbor or cleared
   * if no tabs remain.
   *
   * @param tabID - The ID of the tab to close.
   */
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
      removeTabPastes([tab]);
    },
    [activeTabID, removeTabPastes, setTabsState, tabs]
  );

  /**
   * Closes all unpinned tabs and activates the first pinned tab (if any).
   *
   * Pinned tabs are retained and the first one becomes active. If no pinned tabs
   * remain, the empty state is shown.
   */
  const closeAllTabs = useCallback(() => {
    const pinnedTabs = tabs.filter((t) => t.pinned);
    const closedTabs = tabs.filter((t) => !t.pinned);
    setTabsState(
      pinnedTabs,
      pinnedTabs.length > 0 ? pinnedTabs[0].id : null,
      pinnedTabs.length === 0
    );

    removeTabPastes(closedTabs);
  }, [tabs, setTabsState, removeTabPastes]);

  /**
   * Closes all unpinned tabs except the one specified.
   *
   * The specified tab becomes (or stays) active. Pinned tabs are always kept.
   * Has no effect if `tabID` does not match any existing tab.
   *
   * @param tabID - The ID of the tab that should remain open.
   */
  const closeOtherTabs = useCallback(
    (tabID: string) => {
      const tabToKeep = tabs.find((t) => t.id === tabID);
      if (!tabToKeep) return;

      const newTabs = tabs.filter(({ id, pinned }) => id === tabID || pinned);
      const closedTabs = tabs.filter(({ id, pinned }) => id !== tabID && !pinned);

      setTabsState(newTabs, tabID, false);
      removeTabPastes(closedTabs);
    },
    [tabs, setTabsState, removeTabPastes]
  );

  /**
   * Closes all tabs to the left or right of the specified tab.
   *
   * - `'left'`: removes every tab before the target tab (keeping the target and
   *   everything to its right).
   * - `'right'`: removes every tab after the target tab (keeping the target and
   *   everything to its left).
   *
   * Has no effect if `tabID` is not found in the current tab list.
   *
   * @param direction - The direction relative to `tabID` in which tabs are closed.
   * @param tabID - The pivot tab ID; this tab itself is always kept.
   */
  const closeTabsInDirection = useCallback(
    (direction: 'left' | 'right', tabID: string) => {
      const tabIndex = tabs.findIndex((t) => t.id === tabID);
      if (tabIndex === -1) {
        return;
      }

      const newTabs = direction === 'left' ? tabs.slice(tabIndex) : tabs.slice(0, tabIndex + 1);
      createNewTabState(newTabs);
    },
    [createNewTabState, tabs]
  );

  /**
   * Closes all tabs whose `sourcePath` matches or is nested under the given path prefix.
   *
   * Tabs without a `sourcePath` (e.g., paste tabs) are unaffected. Useful for closing
   * all tabs belonging to a deleted or moved directory.
   *
   * @param pathPrefix - The exact path or directory prefix to match against each tab's
   *   `sourcePath`. A tab is closed if its path equals `pathPrefix` or starts with
   *   `pathPrefix + '/'`.
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

  /**
   * Closes all tabs that originate from the given source type.
   *
   * @param sourceType - The source type to target: `'paste'` for pasted content tabs,
   *   or `'file'` for file-backed tabs.
   */
  const closeTabsBySourceType = useCallback(
    (sourceType: 'paste' | 'file') => {
      const newTabs = tabs.filter((t) => t.sourceType !== sourceType);
      createNewTabState(newTabs);
    },
    [createNewTabState, tabs]
  );

  /**
   * Closes the tab associated with a given file ID.
   *
   * Looks up the tab by its `sourceFileId` and delegates to {@link closeTab}.
   * Has no effect if no open tab references the file.
   *
   * @param fileID - The file ID to search for among open tabs.
   */
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
    closeTabsBySourceType,
  };
}
