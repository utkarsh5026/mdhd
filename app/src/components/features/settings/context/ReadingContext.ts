import { createContext, useContext } from "react";
import type { FontFamily } from "@/components/features/settings/store/reading-settings-store";

export const fontFamilyMap: Record<FontFamily, string> = {
  "system-ui":
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", sans-serif',
  georgia: "Georgia, serif",
  merriweather: '"Merriweather", serif',
  "roboto-slab": '"Roboto Slab", serif',
  "source-serif-pro": '"Source Serif Pro", serif',
  "libre-baskerville": '"Libre Baskerville", serif',
  lora: '"Lora", serif',
  "pt-serif": '"PT Serif", serif',
  "open-sans": '"Open Sans", sans-serif',
  "cascadia-code": '"Cascadia Code", monospace',
  "atkinson-hyperlegible": '"Atkinson Hyperlegible", sans-serif',
  "source-sans-pro": '"Source Sans Pro", sans-serif',
  "nunito-sans": '"Nunito Sans", sans-serif',
  "ibm-plex-sans": '"IBM Plex Sans", sans-serif',
  "crimson-text": '"Crimson Text", serif',
  spectral: '"Spectral", serif',
  "eb-garamond": '"EB Garamond", serif',
  bitter: '"Bitter", serif',
  vollkorn: '"Vollkorn", serif',
  literata: '"Literata", serif',
};

export interface ReadingSettingsContextType {
  settings: {
    fontFamily: FontFamily;
  };
  setFontFamily: (family: FontFamily) => void;
  resetSettings: () => void;
}

export const ReadingSettingsContext =
  createContext<ReadingSettingsContextType | null>(null);

export const useReadingSettings = () => {
  const context = useContext(ReadingSettingsContext);
  if (!context) {
    throw new Error(
      "useReadingSettings must be used within a ReadingSettingsProvider"
    );
  }
  return context;
};
