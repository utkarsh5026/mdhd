import { useCallback, useEffect } from 'react';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import { ThemeOption } from '@/theme/themes';

/**
 * Custom React hook for managing application theme.
 * 
 * This hook provides access to the current theme and allows changing themes dynamically.
 * It automatically applies theme CSS variables to the document root element whenever
 * the theme changes.
 * 
 */
export const useTheme = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  /**
   * Applies the current theme's CSS variables to the document root element.
   * This function updates all theme-related CSS custom properties and ensures
   * the 'dark' class is applied to the root element.
   */
  const changeDocumentTheme = useCallback(() => {
    const root = document.documentElement;

    root.classList.add('dark');
    root.style.setProperty('--background', currentTheme.background);
    root.style.setProperty('--foreground', currentTheme.foreground);
    root.style.setProperty('--primary', currentTheme.primary);
    root.style.setProperty('--primary-foreground', currentTheme.primaryForeground);
    root.style.setProperty('--secondary', currentTheme.secondary);
    root.style.setProperty('--secondary-foreground', currentTheme.secondaryForeground);
    root.style.setProperty('--border', currentTheme.border);
    root.style.setProperty('--card', currentTheme.cardBg);
    root.style.setProperty('--card-foreground', currentTheme.cardForeground);
    root.style.setProperty('--muted', currentTheme.secondary);
    root.style.setProperty('--muted-foreground', currentTheme.mutedForeground);
    root.style.setProperty('--accent', currentTheme.secondary);
    root.style.setProperty('--accent-foreground', currentTheme.accentForeground);
    root.style.setProperty('--popover', currentTheme.cardBg);
    root.style.setProperty('--popover-foreground', currentTheme.popoverForeground);
  }, [currentTheme]);

  useEffect(() => {
    changeDocumentTheme();
  }, [changeDocumentTheme]);

  return {
    currentTheme,
    setTheme: (theme: ThemeOption) => setTheme(theme),
  };
};
