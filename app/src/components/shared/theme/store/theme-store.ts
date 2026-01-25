import { create } from 'zustand';
import { ThemeOption, themes } from '@/theme/themes';
import { withErrorHandling } from '@/utils/functions/error';
import { useShallow } from 'zustand/react/shallow';

const defaultTheme = themes.find((t) => t.name === 'Night Reader') ?? themes[0];

interface ThemeState {
  currentTheme: ThemeOption;
  bookmarkedThemes: ThemeOption[];
  isFloatingPickerOpen: boolean;
  pendingFloatingPickerOpen: boolean;
  setTheme: (theme: ThemeOption) => void;
  toggleBookmark: (theme: ThemeOption) => void;
  isBookmarked: (theme: ThemeOption) => boolean;
  openFloatingPicker: () => void;
  closeFloatingPicker: () => void;
  setPendingFloatingPickerOpen: (pending: boolean) => void;
}

function getFromLocal<T>(key: string, defaultValue: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;

  return withErrorHandling(JSON.parse, defaultValue)(saved);
}

/**
 * 🎨 Theme Store
 *
 * This store manages the current theme of the application and bookmarked themes.
 * It allows you to set the theme, bookmark/unbookmark themes, and check bookmark status.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: getFromLocal('theme', defaultTheme),
  bookmarkedThemes: getFromLocal('bookmarked-themes', []),
  isFloatingPickerOpen: false,
  pendingFloatingPickerOpen: false,

  setTheme: (theme: ThemeOption) => {
    localStorage.setItem('theme', JSON.stringify(theme));
    set({ currentTheme: theme });
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
}));

export function useCurrentTheme() {
  return useThemeStore(
    useShallow(({ currentTheme, setTheme }) => {
      return { currentTheme, setTheme };
    })
  );
}
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

export const useBookmarkedThemes = () => {
  return useThemeStore(
    useShallow(({ bookmarkedThemes, toggleBookmark, isBookmarked }) => {
      return { bookmarkedThemes, toggleBookmark, isBookmarked };
    })
  );
};
