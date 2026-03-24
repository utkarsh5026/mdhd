import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** User-configurable display toggles applied to all code blocks. */
export interface CodeDisplaySettings {
  showLineNumbers: boolean;
  enableCodeFolding: boolean;
  enableWordWrap: boolean;
  showLanguageLabel: boolean;
}

const defaultSettings: CodeDisplaySettings = {
  showLineNumbers: true,
  enableCodeFolding: true,
  enableWordWrap: false,
  showLanguageLabel: true,
};

interface CodeDisplaySettingsStore {
  settings: CodeDisplaySettings;
  setShowLineNumbers: (show: boolean) => void;
  setEnableCodeFolding: (enable: boolean) => void;
  setEnableWordWrap: (enable: boolean) => void;
  setShowLanguageLabel: (show: boolean) => void;
  resetCodeDisplaySettings: () => void;
}

/**
 * Zustand store for code block display preferences.
 *
 * Persists `settings` to localStorage under `'code-display-settings'`.
 * Controls line numbers, code folding, and word wrap across all rendered code blocks.
 */
export const useCodeDisplaySettingsStore = create<CodeDisplaySettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      setShowLineNumbers: (show: boolean) => {
        set((state) => ({
          settings: { ...state.settings, showLineNumbers: show },
        }));
      },

      setEnableCodeFolding: (enable: boolean) => {
        set((state) => ({
          settings: { ...state.settings, enableCodeFolding: enable },
        }));
      },

      setEnableWordWrap: (enable: boolean) => {
        set((state) => ({
          settings: { ...state.settings, enableWordWrap: enable },
        }));
      },

      setShowLanguageLabel: (show: boolean) => {
        set((state) => ({
          settings: { ...state.settings, showLanguageLabel: show },
        }));
      },

      resetCodeDisplaySettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'code-display-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
