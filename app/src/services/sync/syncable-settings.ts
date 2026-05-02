import { useMarkdownStyleStore } from '@/components/features/markdown-style/store/markdown-style-store';
import { useCodeDisplaySettingsStore } from '@/components/features/settings/store/code-display-settings';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';

export interface SyncableStore {
  /** The localStorage key used by this store. */
  key: string;
  /** Human-readable label shown in the sync preferences UI. */
  label: string;
  /** Read the current syncable value from the store. */
  read(): Record<string, unknown> | null;
  /** Write incoming server value into localStorage and rehydrate the Zustand store. */
  write(value: Record<string, unknown>): void;
}

/** Safely parse JSON from localStorage, returning null on failure. */
function readLocalStorage(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * All user-preference stores that participate in cross-device settings sync.
 *
 * Each entry defines how to read the current value from localStorage and how
 * to write an incoming server value back — updating both localStorage and the
 * in-memory Zustand state so the UI reflects the change immediately.
 */
export const syncableStores: SyncableStore[] = [
  {
    key: 'reading-settings',
    label: 'Reading Settings',
    read: () => {
      const state = useReadingSettingsStore.getState();
      return state.settings as unknown as Record<string, unknown>;
    },
    write: (value) => {
      localStorage.setItem('reading-settings', JSON.stringify(value));
      useReadingSettingsStore.setState({ settings: value as never });
    },
  },

  {
    key: 'code-display-settings',
    label: 'Code Display',
    read: () => {
      const raw = readLocalStorage('code-display-settings');
      if (!raw?.state) return null;
      const inner = raw.state as Record<string, unknown>;
      return (inner.settings as Record<string, unknown>) ?? null;
    },
    write: (value) => {
      const wrapped = { state: { settings: value }, version: 0 };
      localStorage.setItem('code-display-settings', JSON.stringify(wrapped));
      useCodeDisplaySettingsStore.persist.rehydrate();
    },
  },

  {
    key: 'code-theme-storage',
    label: 'Code Theme',
    read: () => {
      const raw = readLocalStorage('code-theme-storage');
      if (!raw?.state) return null;
      const inner = raw.state as Record<string, unknown>;
      return inner.selectedTheme == null
        ? null
        : ({ selectedTheme: inner.selectedTheme } as Record<string, unknown>);
    },
    write: (value) => {
      const wrapped = { state: value, version: 0 };
      localStorage.setItem('code-theme-storage', JSON.stringify(wrapped));
      useCodeThemeStore.persist.rehydrate();
    },
  },

  {
    key: 'markdown-style',
    label: 'Markdown Style',
    read: () => {
      const state = useMarkdownStyleStore.getState();
      return state.settings as unknown as Record<string, unknown>;
    },
    write: (value) => {
      localStorage.setItem('markdown-style', JSON.stringify(value));
      useMarkdownStyleStore.setState({ settings: value as never });
    },
  },

  {
    key: 'theme',
    label: 'App Theme',
    read: () => readLocalStorage('theme'),
    write: (value) => {
      localStorage.setItem('theme', JSON.stringify(value));
      useThemeStore.setState({ currentTheme: value as never });
    },
  },

  {
    key: 'bookmarked-themes',
    label: 'Bookmarked Themes',
    read: () => {
      try {
        const raw = localStorage.getItem('bookmarked-themes');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? { bookmarks: parsed } : null;
      } catch {
        return null;
      }
    },
    write: (value) => {
      const bookmarks = (value as { bookmarks: unknown[] }).bookmarks ?? [];
      localStorage.setItem('bookmarked-themes', JSON.stringify(bookmarks));
      useThemeStore.setState({ bookmarkedThemes: bookmarks as never });
    },
  },
];
