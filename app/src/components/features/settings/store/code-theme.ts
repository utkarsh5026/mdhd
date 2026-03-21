import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getThemeBackground as getCodeMirrorThemeBackground } from './codemirror-themes';

export const codeThemes = {
  'Dark Themes': {
    vscDarkPlus: { name: 'VS Code Dark+' },
    oneDark: { name: 'One Dark' },
    atomDark: { name: 'Atom Dark' },
    dracula: { name: 'Dracula' },
  },
  'Light Themes': {
    vs: { name: 'Visual Studio' },
    oneLight: { name: 'One Light' },
    ghcolors: { name: 'GitHub' },
    prism: { name: 'Prism' },
  },
} as const;

/** Union of every valid code-theme identifier across all categories. */
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

/**
 * Zustand store for the active code-block syntax theme.
 *
 * Persists `selectedTheme` to localStorage under `'code-theme-storage'`.
 * Use the `setTheme` action to change the active theme; read `selectedTheme`
 * to drive CodeMirror via `getCodeMirrorTheme`.
 */
export const useCodeThemeStore = create<CodeThemeStore>()(
  persist(
    (set, get) => ({
      selectedTheme: 'vscDarkPlus' as ThemeKey,

      setTheme: (theme: ThemeKey) => {
        set({ selectedTheme: theme });
      },

      /** Returns the human-readable display name of the currently selected theme. */
      getCurrentThemeName: () => {
        const { selectedTheme } = get();

        if (selectedTheme in codeThemes['Dark Themes']) {
          return codeThemes['Dark Themes'][
            selectedTheme as keyof (typeof codeThemes)['Dark Themes']
          ].name;
        }
        if (selectedTheme in codeThemes['Light Themes']) {
          return codeThemes['Light Themes'][
            selectedTheme as keyof (typeof codeThemes)['Light Themes']
          ].name;
        }

        return 'VS Code Dark+';
      },

      getThemesByCategory: () => codeThemes,

      /** Returns the background hex color of the currently selected code theme. */
      getThemeBackground: () => {
        const { selectedTheme } = get();
        return getCodeMirrorThemeBackground(selectedTheme);
      },
    }),
    {
      name: 'code-theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedTheme: state.selectedTheme }),
    }
  )
);
