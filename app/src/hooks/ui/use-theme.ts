import { useEffect } from "react";
import { useThemeStore } from "@/stores/ui/theme-store";
import { ThemeOption } from "@/theme/themes";

/**
 * 🎨 A delightful theme hook that lets users personalize their experience!
 *
 * This hook provides a way to set and apply themes to the application.
 * It also ensures that the dark mode is always enabled.
 *
 */
export const useTheme = () => {
  const { currentTheme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    // Always enable dark mode
    root.classList.add("dark");

    // Apply theme colors
    root.style.setProperty("--background", currentTheme.background);
    root.style.setProperty("--foreground", currentTheme.foreground);
    root.style.setProperty("--primary", currentTheme.primary);
    root.style.setProperty(
      "--primary-foreground",
      currentTheme.primaryForeground
    );
    root.style.setProperty("--secondary", currentTheme.secondary);
    root.style.setProperty(
      "--secondary-foreground",
      currentTheme.secondaryForeground
    );
    root.style.setProperty("--border", currentTheme.border);
    root.style.setProperty("--card", currentTheme.cardBg);
    root.style.setProperty("--card-foreground", currentTheme.cardForeground);
    root.style.setProperty("--muted", currentTheme.secondary);
    root.style.setProperty("--muted-foreground", currentTheme.mutedForeground);
    root.style.setProperty("--accent", currentTheme.secondary);
    root.style.setProperty(
      "--accent-foreground",
      currentTheme.accentForeground
    );
    root.style.setProperty("--popover", currentTheme.cardBg);
    root.style.setProperty(
      "--popover-foreground",
      currentTheme.popoverForeground
    );
  }, [currentTheme]);

  return {
    currentTheme,
    setTheme: (theme: ThemeOption) => setTheme(theme),
  };
};
