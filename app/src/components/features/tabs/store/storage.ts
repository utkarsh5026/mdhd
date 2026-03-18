import { attempt } from '@/utils/functions/error';

import type { Tab, TabReadingState, ViewMode } from './types';

export interface PersistedTabsState {
  state: {
    tabs?: Array<
      Tab & {
        readingState: Omit<TabReadingState, 'readSections' | 'sections'> & {
          readSections: number[];
          viewMode?: 'preview' | 'edit' | 'dual';
        };
      }
    >;
    activeTabId?: string | null;
    showEmptyState?: boolean;
    version?: number;
  };
  version?: number;
}

/**
 * A tab as stored in localStorage: content and sections are stripped to keep
 * the payload small. Sections are re-parsed after hydration (deferred); content
 * for file-backed tabs is reloaded from IndexedDB when the tab is opened.
 */
type PersistedTab = Omit<Tab, 'content'> & {
  content?: string;
  readingState: Omit<TabReadingState, 'readSections' | 'sections'> & {
    readSections: number[];
    viewMode?: ViewMode;
  };
};

/**
 * Custom storage adapter for tabs persistence.
 *
 * getItem: Only handles deserialization concerns (Set restoration, viewMode
 * validation). Section parsing is intentionally deferred to after hydration so
 * it does not block the first render. See onRehydrateStorage in tabs-store.ts.
 *
 * setItem: Strips large fields (content, sections) before persisting to keep
 * localStorage usage bounded.
 */
export const customTabsStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    const getParsedTabs = () => {
      const parsed: PersistedTabsState = JSON.parse(str);
      if (!parsed.state?.tabs) return parsed;

      const updated = (parsed.state.tabs as unknown as PersistedTab[]).map((tab) => {
        const validViewModes: ReadonlyArray<ViewMode> = ['preview', 'edit', 'dual'];
        const viewMode = validViewModes.includes(tab.readingState.viewMode ?? 'preview')
          ? (tab.readingState.viewMode ?? 'preview')
          : 'preview';

        return {
          ...tab,
          // Ensure content is always a string (stripped tabs have no content key)
          content: tab.content ?? '',
          readingState: {
            ...tab.readingState,
            readSections: new Set(tab.readingState.readSections ?? []),
            viewMode,
            // sections are empty on load; populated by initializeTabSections()
            // which runs in a deferred setTimeout after hydration completes.
            sections: [],
            isInitialized: false,
            metadata: null,
            isZenMode: tab.readingState.isZenMode ?? false,
            zenControlsVisible: tab.readingState.zenControlsVisible ?? false,
            isDialogOpen: tab.readingState.isDialogOpen ?? false,
          },
        };
      }) as unknown as typeof parsed.state.tabs;

      parsed.state.tabs = updated;
      return parsed;
    };

    const [error, parsedTabs] = attempt(getParsedTabs);
    if (error) {
      console.error('Error parsing tabs session:', error);
      return null;
    }
    return parsedTabs;
  },

  setItem: (name: string, value: PersistedTabsState) => {
    const storeTabState = () => {
      const serialized = {
        ...value,
        state: {
          ...value.state,
          tabs: value.state.tabs?.map((tab) => ({
            ...tab,
            // File-backed tabs: strip content (reloaded from IndexedDB on hydration).
            // Paste tabs: keep content so it survives page reloads.
            content: tab.sourceType === 'file' ? undefined : tab.content,
            readingState: {
              ...tab.readingState,
              readSections: Array.from(tab.readingState.readSections ?? []),
              sections: undefined,
            },
          })),
        },
      };
      localStorage.setItem(name, JSON.stringify(serialized));
    };

    const [error] = attempt(storeTabState);
    if (error) {
      console.error('Error saving tabs session:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn(
          'localStorage quota exceeded. Tab state is too large to persist. ' +
            'Tabs will be available in the current session but may not survive a page reload.'
        );
      }
    }
  },

  removeItem: (name: string) => localStorage.removeItem(name),
};
