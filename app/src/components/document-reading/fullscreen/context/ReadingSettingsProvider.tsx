import React, { ReactNode, useMemo } from "react";
import { useReadingSettingsStore } from "@/stores/ui/reading-settings-store";
import {
  ReadingSettingsContext,
  type ReadingSettingsContextType,
} from "./ReadingContext";

interface ReadingSettingsProviderProps {
  children: ReactNode;
}

export const ReadingSettingsProvider: React.FC<
  ReadingSettingsProviderProps
> = ({ children }) => {
  const { settings, setFontFamily, resetSettings } = useReadingSettingsStore();

  const value: ReadingSettingsContextType = useMemo(
    () => ({
      settings,
      setFontFamily,
      resetSettings,
    }),
    [settings, setFontFamily, resetSettings]
  );

  return (
    <ReadingSettingsContext.Provider value={value}>
      {children}
    </ReadingSettingsContext.Provider>
  );
};
