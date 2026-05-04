import type { Tab } from './types';

/**
 * Resolves a tab by id from tabs store state. Use inside `useTabsStore`
 * selectors so tab lookup stays consistent across the app.
 */
export function selectTabById(state: { tabs: Tab[] }, tabId: string): Tab | undefined {
  return state.tabs.find((t) => t.id === tabId);
}
