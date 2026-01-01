import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CodeDisplaySettings {
  showLineNumbers: boolean;
  enableCodeFolding: boolean;
  enableWordWrap: boolean;
}

const defaultSettings: CodeDisplaySettings = {
  showLineNumbers: true,
  enableCodeFolding: true,
  enableWordWrap: false,
};

interface CodeDisplaySettingsStore {
  settings: CodeDisplaySettings;
  setShowLineNumbers: (show: boolean) => void;
  setEnableCodeFolding: (enable: boolean) => void;
  setEnableWordWrap: (enable: boolean) => void;
  resetCodeDisplaySettings: () => void;
}

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

      resetCodeDisplaySettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: "code-display-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
