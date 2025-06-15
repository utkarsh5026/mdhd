import { create } from "zustand";
import { useThemeStore } from "./theme-store";

export type FontFamily =
  | "system-ui"
  | "inter"
  | "georgia"
  | "merriweather"
  | "roboto-slab"
  | "source-serif-pro"
  | "libre-baskerville"
  | "lora"
  | "pt-serif"
  | "open-sans"
  | "cascadia-code"
  | "atkinson-hyperlegible"
  | "source-sans-pro"
  | "nunito-sans"
  | "ibm-plex-sans"
  | "crimson-text"
  | "spectral"
  | "eb-garamond"
  | "bitter"
  | "vollkorn"
  | "literata";

export interface ReadingSettings {
  fontFamily: FontFamily;
  customBackground: string | null;
}

interface ReadingSettingsState {
  settings: ReadingSettings;
  setFontFamily: (family: FontFamily) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontFamily: "roboto-slab",
  customBackground: useThemeStore.getState().currentTheme.background,
};

// Load settings from localStorage or use defaults
const loadInitialSettings = (): ReadingSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  const savedSettings = localStorage.getItem("reading-settings");
  if (!savedSettings) return DEFAULT_SETTINGS;

  try {
    return JSON.parse(savedSettings);
  } catch (e) {
    console.error("Error parsing saved reading settings:", e);
    return DEFAULT_SETTINGS;
  }
};

export const useReadingSettingsStore = create<ReadingSettingsState>((set) => ({
  settings: loadInitialSettings(),

  setFontFamily: (family: FontFamily) =>
    set((state) => {
      const newSettings = { ...state.settings, fontFamily: family };
      localStorage.setItem("reading-settings", JSON.stringify(newSettings));
      return { settings: newSettings };
    }),

  resetSettings: () =>
    set(() => {
      localStorage.removeItem("reading-settings");
      return { settings: DEFAULT_SETTINGS };
    }),
}));
