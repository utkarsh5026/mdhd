import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FontFamily } from '@/lib/font';
import { patch } from '@/lib/store-utils';

/**
 * A monospace face offered for code blocks.
 *
 * `value` is what CodeMirror receives as its font family, so it is the face's
 * real CSS name rather than a slug. `slug` is the key `@/lib/font-loader` uses
 * to fetch the webfont, and is `null` for stacks that are already on the system
 * and need no download.
 */
export interface CodeFontOption {
  value: string;
  label: string;
  description: string;
  slug: FontFamily | null;
  /** Whether the face draws programming ligatures (`=>`, `!==`, `->`). */
  hasLigatures: boolean;
}

/** The monospace faces selectable for code blocks, in menu order. */
export const CODE_FONT_OPTIONS: readonly CodeFontOption[] = [
  {
    value: 'JetBrains Mono',
    label: 'JetBrains Mono',
    description: 'Tall x-height, built for long reading sessions',
    slug: 'jetbrains-mono',
    hasLigatures: true,
  },
  {
    value: 'Fira Code',
    label: 'Fira Code',
    description: 'The classic ligature font',
    slug: 'fira-code',
    hasLigatures: true,
  },
  {
    value: 'Source Code Pro',
    label: 'Source Code Pro',
    description: "Adobe's monospace — clean and neutral",
    slug: 'source-code-pro',
    hasLigatures: false,
  },
  {
    value: 'Cascadia Code',
    label: 'Cascadia Code',
    description: "Windows Terminal's font, if you have it installed",
    slug: 'cascadia-code',
    hasLigatures: true,
  },
  {
    value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    label: 'System Monospace',
    description: 'Whatever your OS uses — nothing to download',
    slug: null,
    hasLigatures: false,
  },
];

/** Line height bounds, as a unitless multiple of the font size. */
export const CODE_LINE_HEIGHT_RANGE = { min: 1.2, max: 2.4, step: 0.1 } as const;

/** Letter spacing bounds, in px. Negative values tighten wide faces. */
export const CODE_LETTER_SPACING_RANGE = { min: -0.5, max: 2, step: 0.1 } as const;

/** User-configurable display and typography settings applied to all code blocks. */
export interface CodeDisplaySettings {
  showLineNumbers: boolean;
  enableCodeFolding: boolean;
  enableWordWrap: boolean;
  showLanguageLabel: boolean;
  /** CSS font family for code — one of {@link CODE_FONT_OPTIONS}' `value`s. */
  fontFamily: string;
  /** Whether to render the font's ligatures. Ignored by faces that have none. */
  fontLigatures: boolean;
  /** Line height as a multiple of font size. See {@link CODE_LINE_HEIGHT_RANGE}. */
  lineHeight: number;
  /** Letter spacing in px. See {@link CODE_LETTER_SPACING_RANGE}. */
  letterSpacing: number;
}

const defaultSettings: CodeDisplaySettings = {
  showLineNumbers: true,
  enableCodeFolding: true,
  enableWordWrap: false,
  showLanguageLabel: true,
  fontFamily: 'JetBrains Mono',
  fontLigatures: true,
  lineHeight: 1.6,
  letterSpacing: 0,
};

interface CodeDisplaySettingsStore {
  settings: CodeDisplaySettings;
  /** Shallow-merges `updates` into the current settings. */
  updateCodeDisplaySettings: (updates: Partial<CodeDisplaySettings>) => void;
  resetCodeDisplaySettings: () => void;
}

/**
 * Zustand store for code block display preferences.
 *
 * Persists `settings` to localStorage under `'code-display-settings'`.
 * Controls line numbers, folding, wrapping, and the typography — face,
 * ligatures, line height, letter spacing — of every rendered code block.
 */
export const useCodeDisplaySettingsStore = create<CodeDisplaySettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateCodeDisplaySettings: (updates: Partial<CodeDisplaySettings>) => {
        set((state) => ({ settings: patch(state.settings, updates) }));
      },

      resetCodeDisplaySettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'code-display-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
      // Settings written before the typography fields existed rehydrate without
      // them; fall back field by field rather than trusting the stored shape.
      merge: (persisted, current) => ({
        ...current,
        settings: {
          ...defaultSettings,
          ...((persisted as { settings?: Partial<CodeDisplaySettings> })?.settings ?? {}),
        },
      }),
    }
  )
);

/**
 * Looks up the {@link CodeFontOption} backing a stored `fontFamily`, falling
 * back to the default face when a persisted value no longer exists.
 *
 * @param value - A `fontFamily` from {@link CodeDisplaySettings}.
 */
export function getCodeFontOption(value: string): CodeFontOption {
  return CODE_FONT_OPTIONS.find((font) => font.value === value) ?? CODE_FONT_OPTIONS[0];
}
