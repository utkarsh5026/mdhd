import { create } from 'zustand';
import { ThemeOption, themes } from '@/theme/themes';

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

const getInitialTheme = (): ThemeOption => {
  const savedTheme = localStorage.getItem('theme');
  if (!savedTheme) {
    return defaultTheme;
  }

  try {
    return JSON.parse(savedTheme);
  } catch (e) {
    console.error('Error parsing theme from localStorage:', e);
    return defaultTheme;
  }
};

const getInitialBookmarkedThemes = (): ThemeOption[] => {
  const savedBookmarks = localStorage.getItem('bookmarked-themes');
  if (!savedBookmarks) {
    return [];
  }

  try {
    return JSON.parse(savedBookmarks);
  } catch (e) {
    console.error('Error parsing bookmarked themes from localStorage:', e);
    return [];
  }
};

/**
 * 🎨 Theme Store
 *
 * This store manages the current theme of the application and bookmarked themes.
 * It allows you to set the theme, bookmark/unbookmark themes, and check bookmark status.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: getInitialTheme(),
  bookmarkedThemes: getInitialBookmarkedThemes(),
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
