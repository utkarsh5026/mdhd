import { create } from "zustand";
import { useThemeStore } from "@/components/shared/theme/store/theme-store";

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
  // Typography settings
  fontSize: number; // 14-28px
  lineHeight: number; // 1.4-2.2
  contentWidth: number; // 500-900px
}

interface ReadingSettingsState {
  settings: ReadingSettings;
  setFontFamily: (family: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setContentWidth: (width: number) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontFamily: "roboto-slab",
  customBackground: useThemeStore.getState().currentTheme.background,
  // Typography defaults
  fontSize: 18,
  lineHeight: 1.7,
  contentWidth: 700,
};

// Load settings from localStorage or use defaults
const loadInitialSettings = (): ReadingSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  const savedSettings = localStorage.getItem("reading-settings");
  if (!savedSettings) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(savedSettings);
    // Merge with defaults to ensure all required fields are present
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Error parsing saved reading settings:", e);
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (settings: ReadingSettings) => {
  localStorage.setItem("reading-settings", JSON.stringify(settings));
};

export const useReadingSettingsStore = create<ReadingSettingsState>((set) => ({
  settings: loadInitialSettings(),

  setFontFamily: (family: FontFamily) =>
    set((state) => {
      const newSettings = { ...state.settings, fontFamily: family };
      saveSettings(newSettings);
      return { settings: newSettings };
    }),

  setFontSize: (size: number) =>
    set((state) => {
      const newSettings = { ...state.settings, fontSize: Math.min(28, Math.max(14, size)) };
      saveSettings(newSettings);
      return { settings: newSettings };
    }),

  setLineHeight: (height: number) =>
    set((state) => {
      const newSettings = { ...state.settings, lineHeight: Math.min(2.2, Math.max(1.4, height)) };
      saveSettings(newSettings);
      return { settings: newSettings };
    }),

  setContentWidth: (width: number) =>
    set((state) => {
      const newSettings = { ...state.settings, contentWidth: Math.min(900, Math.max(500, width)) };
      saveSettings(newSettings);
      return { settings: newSettings };
    }),

  resetSettings: () =>
    set(() => {
      localStorage.removeItem("reading-settings");
      return { settings: DEFAULT_SETTINGS };
    }),
}));
