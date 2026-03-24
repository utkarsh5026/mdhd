import { useMemo } from 'react';

import type { Tab } from '../store';

/**
 * Display metadata for a single tab in the tab bar.
 *
 * @property filename - The tab's display name (derived from its title).
 * @property folderPath - Parent folder path, or `null` for root-level files.
 * @property fullPath - Original source path, or `null` if not from a file.
 * @property isDuplicate - Whether another open tab shares the same filename.
 */
export interface TabDisplayInfo {
  filename: string;
  folderPath: string | null;
  fullPath: string | null;
  isDuplicate: boolean;
}

/**
 * Extracts the folder path from a file path (without the filename)
 * Example: "xy/ab/skill.md" -> "xy/ab"
 */
const getFolderPath = (path: string): string | null => {
  const normalized = path.replace(/\\/g, '/');
  const lastSlashIndex = normalized.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return null;
  }

  return normalized.substring(0, lastSlashIndex);
};

/**
 * Generates display metadata for a set of tabs.
 *
 * Groups tabs by title to detect duplicates, then builds a map of
 * per-tab display info including folder paths for disambiguation.
 *
 * @param tabs - The current list of open tabs.
 * @returns A map from tab ID to its {@link TabDisplayInfo}.
 */
function generateTabDisplayNames(tabs: Tab[]): Map<string, TabDisplayInfo> {
  const displayMap = new Map<string, TabDisplayInfo>();
  const titleGroups = new Map<string, Tab[]>();

  tabs.forEach((tab) => {
    const existing = titleGroups.get(tab.title) || [];
    existing.push(tab);
    titleGroups.set(tab.title, existing);
  });

  tabs.forEach((tab) => {
    const tabsWithSameTitle = titleGroups.get(tab.title) || [];
    const isDuplicate = tabsWithSameTitle.length > 1;

    const filename = tab.title;
    let folderPath: string | null = null;
    let fullPath: string | null = null;

    if (tab.sourcePath) {
      folderPath = getFolderPath(tab.sourcePath);
      fullPath = tab.sourcePath;
    }

    displayMap.set(tab.id, {
      filename,
      folderPath,
      fullPath,
      isDuplicate,
    });
  });

  return displayMap;
}

/**
 * Hook that computes display metadata for the tab bar.
 *
 * Memoizes the result of {@link generateTabDisplayNames} so the map
 * is only recomputed when the tabs array changes.
 *
 * @hook
 * @param tabs - The current list of open tabs.
 * @returns A `Map<string, TabDisplayInfo>` keyed by tab ID.
 */
export function useTabDisplayMap(tabs: Tab[]) {
  return useMemo(() => generateTabDisplayNames(tabs), [tabs]);
}
