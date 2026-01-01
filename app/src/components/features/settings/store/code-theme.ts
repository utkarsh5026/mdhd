import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getThemeBackground as getCodeMirrorThemeBackground } from "./codemirror-themes";

export const codeThemes = {
  "Dark Themes": {
    vscDarkPlus: { name: "VS Code Dark+" },
    oneDark: { name: "One Dark" },
    atomDark: { name: "Atom Dark" },
    dracula: { name: "Dracula" },
  },
  "Light Themes": {
    vs: { name: "Visual Studio" },
    oneLight: { name: "One Light" },
    ghcolors: { name: "GitHub" },
    prism: { name: "Prism" },
  },
} as const;

export type ThemeKey = {
  [K in keyof typeof codeThemes]: keyof (typeof codeThemes)[K];
}[keyof typeof codeThemes];

interface CodeThemeStore {
  selectedTheme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  getCurrentThemeName: () => string;
  getThemesByCategory: () => typeof codeThemes;
  getThemeBackground: () => string;
}

export const useCodeThemeStore = create<CodeThemeStore>()(
  persist(
    (set, get) => ({
      selectedTheme: "vscDarkPlus" as ThemeKey,

      setTheme: (theme: ThemeKey) => {
        set({ selectedTheme: theme });
      },

      getCurrentThemeName: () => {
        const { selectedTheme } = get();

        if (selectedTheme in codeThemes["Dark Themes"]) {
          return codeThemes["Dark Themes"][
            selectedTheme as keyof (typeof codeThemes)["Dark Themes"]
          ].name;
        }
        if (selectedTheme in codeThemes["Light Themes"]) {
          return codeThemes["Light Themes"][
            selectedTheme as keyof (typeof codeThemes)["Light Themes"]
          ].name;
        }

        return "VS Code Dark+";
      },

      getThemesByCategory: () => codeThemes,

      getThemeBackground: () => {
        const { selectedTheme } = get();
        return getCodeMirrorThemeBackground(selectedTheme);
      },
    }),
    {
      name: "code-theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedTheme: state.selectedTheme }),
    }
  )
);
