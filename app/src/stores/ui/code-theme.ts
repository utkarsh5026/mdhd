import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  oneDark,
  vscDarkPlus,
  atomDark,
  coldarkDark,
  dracula,
  nightOwl,
  synthwave84,
  duotoneDark,
  materialDark,
  nord,
  prism,
  darcula,
  cb,
  ghcolors,
  shadesOfPurple,
  tomorrow,
  oneLight,
  duotoneLight,
  materialLight,
  coy,
  base16AteliersulphurpoolLight,
  vs,
  coldarkCold,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

export const codeThemes = {
  "Dark Themes": {
    oneDark: { name: "One Dark", style: oneDark },
    vscDarkPlus: { name: "VS Code Dark+", style: vscDarkPlus },
    atomDark: { name: "Atom Dark", style: atomDark },
    coldarkDark: { name: "Coldark Dark", style: coldarkDark },
    dracula: { name: "Dracula", style: dracula },
    nightOwl: { name: "Night Owl", style: nightOwl },
    synthwave84: { name: "Synthwave '84", style: synthwave84 },
    duotoneDark: { name: "Duotone Dark", style: duotoneDark },
    materialDark: { name: "Material Dark", style: materialDark },
    nord: { name: "Nord", style: nord },
    darcula: { name: "Darcula", style: darcula },
    shadesOfPurple: { name: "Shades of Purple", style: shadesOfPurple },
    tomorrow: { name: "Tomorrow Night", style: tomorrow },
  },
  "Light Themes": {
    oneLight: { name: "One Light", style: oneLight },
    duotoneLight: { name: "Duotone Light", style: duotoneLight },
    materialLight: { name: "Material Light", style: materialLight },
    coy: { name: "Coy", style: coy },
    base16AteliersulphurpoolLight: {
      name: "Atelier Sulphurpool Light",
      style: base16AteliersulphurpoolLight,
    },
    vs: { name: "Visual Studio", style: vs },
    coldarkCold: { name: "Coldark Cold", style: coldarkCold },
    prism: { name: "Prism Default", style: prism },
  },
  "Unique Themes": {
    cb: { name: "CB", style: cb },
    ghcolors: { name: "GitHub Colors", style: ghcolors },
  },
} as const;

export type ThemeKey = {
  [K in keyof typeof codeThemes]: keyof (typeof codeThemes)[K];
}[keyof typeof codeThemes];

interface CodeThemeStore {
  selectedTheme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  getCurrentThemeStyle: () => { [key: string]: React.CSSProperties };
  getCurrentThemeName: () => string;
  getThemesByCategory: () => typeof codeThemes;
}

export const useCodeThemeStore = create<CodeThemeStore>()(
  persist(
    (set, get) => ({
      selectedTheme: "oneDark" as ThemeKey,

      setTheme: (theme: ThemeKey) => {
        set({ selectedTheme: theme });
      },

      getCurrentThemeStyle: () => {
        const { selectedTheme } = get();

        if (selectedTheme in codeThemes["Dark Themes"]) {
          return codeThemes["Dark Themes"][
            selectedTheme as keyof (typeof codeThemes)["Dark Themes"]
          ].style;
        }
        if (selectedTheme in codeThemes["Light Themes"]) {
          return codeThemes["Light Themes"][
            selectedTheme as keyof (typeof codeThemes)["Light Themes"]
          ].style;
        }
        if (selectedTheme in codeThemes["Unique Themes"]) {
          return codeThemes["Unique Themes"][
            selectedTheme as keyof (typeof codeThemes)["Unique Themes"]
          ].style;
        }

        return oneDark;
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
        if (selectedTheme in codeThemes["Unique Themes"]) {
          return codeThemes["Unique Themes"][
            selectedTheme as keyof (typeof codeThemes)["Unique Themes"]
          ].name;
        }

        return "One Dark";
      },

      getThemesByCategory: () => codeThemes,
    }),
    {
      name: "code-theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedTheme: state.selectedTheme }),
    }
  )
);
