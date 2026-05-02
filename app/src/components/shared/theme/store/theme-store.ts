import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import {
  codeThemes,
  type ThemeKey,
  useCodeThemeStore,
} from '@/components/features/settings/store/code-theme';
import { defaultThemes, loadAllThemes, ThemeOption } from '@/theme/themes';
import { withErrorHandling } from '@/utils/error';

/** Default theme used when no persisted selection exists. Prefers "GitHub Dark"; falls back to the first available theme. */
const fallbackTheme = defaultThemes.find((t) => t.name === 'GitHub Dark') ?? defaultThemes[0];

/**
 * Shape of the Zustand theme store — combines reactive state with bound actions.
 *
 * Consumers should prefer the focused selector hooks ({@link useCurrentTheme},
 * {@link useThemeFloatingPicker}, {@link useBookmarkedThemes}) over reading this
 * store directly, so that components only re-render when the slice they care about changes.
 */
interface ThemeState {
  /** The currently active UI theme. Persisted to `localStorage` under the key `"theme"`. */
  currentTheme: ThemeOption;
  /** User-bookmarked themes. Persisted to `localStorage` under `"bookmarked-themes"`. */
  bookmarkedThemes: ThemeOption[];
  /** Whether the floating theme-picker popover is currently visible. */
  isFloatingPickerOpen: boolean;
  /**
   * Deferred open flag set when the picker should open after a pending interaction
   * (e.g., after a navigation animation completes).
   */
  pendingFloatingPickerOpen: boolean;
  /** Full catalogue of available themes. Starts as `defaultThemes`; expanded after {@link ThemeState.loadThemes} resolves. */
  allThemes: ThemeOption[];
  /** `true` once the full theme catalogue has been lazy-loaded via {@link ThemeState.loadThemes}. */
  isThemesLoaded: boolean;
  /**
   * Activates `theme` and persists the selection to `localStorage`.
   *
   * Also auto-switches the code-block highlight theme to a sensible default
   * (`vscDarkPlus` for dark UI themes, `vs` for light ones) when the current
   * code theme's polarity no longer matches the new UI theme.
   */
  setTheme: (theme: ThemeOption) => void;
  /**
   * Adds `theme` to bookmarks if not already bookmarked; removes it otherwise.
   * Persists the updated list to `localStorage`.
   */
  toggleBookmark: (theme: ThemeOption) => void;
  /** Returns `true` when `theme` is in the current bookmarked list. */
  isBookmarked: (theme: ThemeOption) => boolean;
  /** Opens the floating theme-picker and clears any pending-open flag. */
  openFloatingPicker: () => void;
  /** Closes the floating theme-picker. */
  closeFloatingPicker: () => void;
  /** Sets the deferred `pendingFloatingPickerOpen` flag without immediately opening the picker. */
  setPendingFloatingPickerOpen: (pending: boolean) => void;
  /**
   * Lazy-loads the full theme catalogue from {@link loadAllThemes} and stores the result.
   *
   * Subsequent calls are no-ops once `isThemesLoaded` is `true`.
   *
   * @async
   */
  loadThemes: () => Promise<void>;
}

/**
 * Reads and JSON-parses a value from `localStorage`, returning `defaultValue` on any error.
 *
 * @param key - The `localStorage` key to read.
 * @param defaultValue - Returned when the key is absent or the stored value fails to parse.
 */
function getFromLocal<T>(key: string, defaultValue: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;

  return withErrorHandling(JSON.parse, defaultValue)(saved);
}

/**
 * Global Zustand store for UI theme management.
 *
 * Tracks the active theme, bookmarked favorites, floating picker visibility, and the
 * lazy-loaded full theme catalogue. State that must survive page reloads is mirrored to
 * `localStorage`; the full theme list is loaded on demand to keep the initial bundle small.
 *
 * Prefer the focused selector hooks over consuming this store directly.
 *
 * @see {@link useCurrentTheme}
 * @see {@link useThemeFloatingPicker}
 * @see {@link useBookmarkedThemes}
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: getFromLocal('theme', fallbackTheme),
  bookmarkedThemes: getFromLocal('bookmarked-themes', []),
  isFloatingPickerOpen: false,
  pendingFloatingPickerOpen: false,
  allThemes: defaultThemes,
  isThemesLoaded: false,

  setTheme: (theme: ThemeOption) => {
    localStorage.setItem('theme', JSON.stringify(theme));
    set({ currentTheme: theme });

    const codeThemeStore = useCodeThemeStore.getState();
    const currentCodeTheme = codeThemeStore.selectedTheme;
    const isCurrentCodeThemeDark = currentCodeTheme in codeThemes['Dark Themes'];

    if (theme.isDark && !isCurrentCodeThemeDark) {
      codeThemeStore.setTheme('vscDarkPlus' as ThemeKey);
      return;
    }

    if (!theme.isDark && isCurrentCodeThemeDark) {
      codeThemeStore.setTheme('vs' as ThemeKey);
    }
  },

  toggleBookmark: (theme: ThemeOption) => {
    const { bookmarkedThemes } = get();
    const isBookmarked = bookmarkedThemes.some((b) => b.name === theme.name);

    let bookmarked: ThemeOption[];

    if (isBookmarked) {
      bookmarked = bookmarkedThemes.filter((b) => b.name !== theme.name);
    } else {
      bookmarked = [...bookmarkedThemes, theme];
    }

    localStorage.setItem('bookmarked-themes', JSON.stringify(bookmarked));
    set({ bookmarkedThemes: bookmarked });
  },

  isBookmarked: (theme: ThemeOption) => {
    const { bookmarkedThemes } = get();
    return bookmarkedThemes.some((b) => b.name === theme.name);
  },

  openFloatingPicker: () => set({ isFloatingPickerOpen: true, pendingFloatingPickerOpen: false }),
  closeFloatingPicker: () => set({ isFloatingPickerOpen: false }),
  setPendingFloatingPickerOpen: (pending: boolean) => set({ pendingFloatingPickerOpen: pending }),

  loadThemes: async () => {
    const { isThemesLoaded } = get();
    if (isThemesLoaded) return;

    try {
      const allThemes = await loadAllThemes();
      set({ allThemes, isThemesLoaded: true });
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  },
}));

/**
 * Selector hook that exposes the active theme and its setter.
 *
 * Uses `useShallow` so the component only re-renders when `currentTheme` or `setTheme` changes.
 */
export function useCurrentTheme() {
  return useThemeStore(
    useShallow(({ currentTheme, setTheme }) => {
      return { currentTheme, setTheme };
    })
  );
}

/**
 * Selector hook for the floating theme-picker popover.
 *
 * Returns open/close actions, the current visibility flag, and the deferred-open flag.
 * Uses `useShallow` to avoid unnecessary re-renders.
 */
export function useThemeFloatingPicker() {
  return useThemeStore(
    useShallow(
      ({
        isFloatingPickerOpen,
        openFloatingPicker,
        closeFloatingPicker,
        pendingFloatingPickerOpen,
      }) => {
        return {
          isFloatingPickerOpen,
          openFloatingPicker,
          closeFloatingPicker,
          pendingFloatingPickerOpen,
        };
      }
    )
  );
}

/**
 * Selector hook for the bookmarked-themes list and its mutation actions.
 *
 * Returns `bookmarkedThemes`, `toggleBookmark`, and `isBookmarked`.
 * Uses `useShallow` so callers only re-render on bookmark list changes.
 */
export const useBookmarkedThemes = () => {
  return useThemeStore(
    useShallow(({ bookmarkedThemes, toggleBookmark, isBookmarked }) => {
      return { bookmarkedThemes, toggleBookmark, isBookmarked };
    })
  );
};
