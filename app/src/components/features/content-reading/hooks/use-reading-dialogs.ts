import { useCallback, useEffect } from 'react';

import { useThemeFloatingPicker } from '@/components/shared/theme/store/theme-store';
import { useToggle } from '@/hooks';

/** Return shape for {@link useReadingDialogs}. */
interface UseReadingDialogsReturn {
  settingsOpen: boolean;
  pdfExportOpen: boolean;
  searchOpen: boolean;
  tocOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setPdfExportOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setTocOpen: (open: boolean) => void;
  handleSettingsOpen: () => void;
  handlePdfExportOpen: () => void;
  handleTocOpen: () => void;
}

/**
 * Manages open/close state for reading-mode dialogs (settings, PDF export, search).
 *
 * Also handles the delayed opening of the floating theme picker after the
 * settings sheet closes, so the picker doesn't overlap the closing animation.
 *
 * @hook
 * @param handleInteraction - Callback to reset the controls-visibility timer
 *   whenever a dialog is opened.
 * @returns Dialog open states, their setters, and wrapped open handlers.
 */
export const useReadingDialogs = (handleInteraction: () => void): UseReadingDialogsReturn => {
  const { state: settingsOpen, setTrue: openSettings, set: setSettingsOpen } = useToggle();
  const { state: pdfExportOpen, setTrue: openPdfExport, set: setPdfExportOpen } = useToggle();
  const { state: searchOpen, set: setSearchOpen } = useToggle();
  const { state: tocOpen, toggle: toggleToc, set: setTocOpen } = useToggle();

  const { openFloatingPicker, pendingFloatingPickerOpen } = useThemeFloatingPicker();

  useEffect(() => {
    if (!settingsOpen && pendingFloatingPickerOpen) {
      const timer = setTimeout(() => {
        openFloatingPicker();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [settingsOpen, pendingFloatingPickerOpen, openFloatingPicker]);

  const handleSettingsOpen = useCallback(() => {
    openSettings();
    handleInteraction();
  }, [handleInteraction, openSettings]);

  const handlePdfExportOpen = useCallback(() => {
    openPdfExport();
    handleInteraction();
  }, [handleInteraction, openPdfExport]);

  const handleTocOpen = useCallback(() => {
    toggleToc();
    handleInteraction();
  }, [handleInteraction, toggleToc]);

  return {
    settingsOpen,
    pdfExportOpen,
    searchOpen,
    tocOpen,
    setSettingsOpen,
    setPdfExportOpen,
    setSearchOpen,
    setTocOpen,
    handleSettingsOpen,
    handlePdfExportOpen,
    handleTocOpen,
  };
};
