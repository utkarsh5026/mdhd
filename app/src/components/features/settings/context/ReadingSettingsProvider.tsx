import React, { ReactNode, useMemo } from 'react';
import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';
import { ReadingSettingsContext, type ReadingSettingsContextType } from './ReadingContext';

interface ReadingSettingsProviderProps {
  children: ReactNode;
}

export const ReadingSettingsProvider: React.FC<ReadingSettingsProviderProps> = ({ children }) => {
  const { settings, setFontFamily, setFontSize, setLineHeight, setContentWidth, resetSettings } =
    useReadingSettingsStore();

  const value: ReadingSettingsContextType = useMemo(
    () => ({
      settings,
      setFontFamily,
      setFontSize,
      setLineHeight,
      setContentWidth,
      resetSettings,
    }),
    [settings, setFontFamily, setFontSize, setLineHeight, setContentWidth, resetSettings]
  );

  return (
    <ReadingSettingsContext.Provider value={value}>{children}</ReadingSettingsContext.Provider>
  );
};
