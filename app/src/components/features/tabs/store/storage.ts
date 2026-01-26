import { attempt } from '@/utils/functions/error';
import type { Tab, TabReadingState, ViewMode } from './types';
import { parseMarkdownIntoSections } from '@/services/section/parsing';

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
 * Custom storage adapter for tabs persistence
 * Handles Set serialization and section re-parsing
 */
export const customTabsStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    const getParsedTabs = () => {
      const parsed: PersistedTabsState = JSON.parse(str);
      if (!parsed.state?.tabs) return parsed;

      const updated = parsed.state.tabs.map((tab) => {
        const { metadata, sections } = parseMarkdownIntoSections(tab.content);
        const validViewModes: ReadonlyArray<ViewMode> = ['preview', 'edit', 'dual'];
        const viewMode = validViewModes.includes(tab.readingState.viewMode || 'preview')
          ? tab.readingState.viewMode || 'preview'
          : 'preview';

        return {
          ...tab,
          readingState: {
            ...tab.readingState,
            readSections: new Set(tab.readingState.readSections || []),
            viewMode,
            sections,
            isInitialized: sections.length > 0,
            metadata,
            // Initialize new fields for backward compatibility
            isZenMode: tab.readingState.isZenMode ?? false,
            zenControlsVisible: tab.readingState.zenControlsVisible ?? false,
            isDialogOpen: tab.readingState.isDialogOpen ?? false,
          },
        };
      }) as typeof parsed.state.tabs;

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
            readingState: {
              ...tab.readingState,
              readSections: Array.from(tab.readingState.readSections || []),
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
    }
  },

  removeItem: (name: string) => localStorage.removeItem(name),
};
