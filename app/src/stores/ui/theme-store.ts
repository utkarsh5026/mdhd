import { create } from "zustand";
import { ThemeOption, themes } from "@/theme/themes";

const defaultTheme = themes[0];

interface ThemeState {
  currentTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const getInitialTheme = (): ThemeOption => {
  const savedTheme = localStorage.getItem("theme");
  if (!savedTheme) {
    return defaultTheme;
  }

  try {
    return JSON.parse(savedTheme);
  } catch (e) {
    console.error("Error parsing theme from localStorage:", e);
    return defaultTheme;
  }
};

/**
 * 🎨 Theme Store
 *
 * This store manages the current theme of the application.
 * It allows you to set the theme and get the current theme.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: getInitialTheme(),
  setTheme: (theme: ThemeOption) => {
    localStorage.setItem("theme", JSON.stringify(theme));
    set({ currentTheme: theme });
  },
}));
