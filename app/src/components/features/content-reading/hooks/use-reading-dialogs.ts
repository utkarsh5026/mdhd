import { useCallback, useEffect, useState } from 'react';

import { useThemeFloatingPicker } from '@/components/shared/theme/store/theme-store';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

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
    setSettingsOpen(true);
    handleInteraction();
  }, [handleInteraction]);

  const handlePdfExportOpen = useCallback(() => {
    setPdfExportOpen(true);
    handleInteraction();
  }, [handleInteraction]);

  const handleTocOpen = useCallback(() => {
    setTocOpen((prev) => !prev);
    handleInteraction();
  }, [handleInteraction]);

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
