import type { StateCreator } from 'zustand';

import type { TextSizeScale } from '@/components/features/markdown-render/utils/text-size-classes';
import type {
  BodyFontWeight,
  LetterSpacing,
  ParagraphSpacing,
  TextAlignment,
  TextIndent,
  WordSpacing,
} from '@/components/features/markdown-render/utils/typography-classes';
import type { AppFontFamily, FontFamily } from '@/lib/font';
import { APP_FONT_CSS_MAP, getSupportedBodyWeights } from '@/lib/font';
import { loadFont } from '@/lib/font-loader';
import { clamp } from '@/lib/utils';
import { tryCatch } from '@/utils/error';

const TYPOGRAPHY_STORAGE_KEY = 'typography-settings';
const LEGACY_STORAGE_KEY = 'reading-settings';

export type { TextSizeScale };
export type {
  BodyFontWeight,
  LetterSpacing,
  ParagraphSpacing,
  TextAlignment,
  TextIndent,
  WordSpacing,
};

/**
 * Complete set of user-configurable typography preferences applied to the reading view.
 *
 * Persisted to `localStorage` under `typography-settings` and restored on startup.
 */
export interface TypographySettings {
  /** Font family used for the markdown body text. */
  fontFamily: FontFamily;
  /** Font family used for the application UI chrome (nav, sidebar, etc.). */
  appFontFamily: AppFontFamily;
  fontSize: number; // 14–28px
  lineHeight: number; // 1.4–2.2
  /** Proportional scale applied to heading/code sizes relative to the body font size. */
  textSizeScale: TextSizeScale;
  letterSpacing: LetterSpacing;
  wordSpacing: WordSpacing;
  paragraphSpacing: ParagraphSpacing;
  textAlignment: TextAlignment;
  /** CSS `font-weight` for body paragraphs. Constrained to weights supported by `fontFamily`. */
  bodyFontWeight: BodyFontWeight;
  textIndent: TextIndent;
}

/**
 * Zustand slice that owns all typography state and the actions that mutate it.
 *
 * Every action immediately persists the new settings to `localStorage` via
 * {@link patchTypography}, so changes survive page reloads without a separate
 * save step.
 */
export interface TypographySlice {
  typography: TypographySettings;
  /**
   * Updates the body font family, triggers an async font load, and resets
   * `bodyFontWeight` to `'normal'` when the current weight is not supported
   * by the new family.
   */
  setFontFamily: (family: FontFamily) => void;
  /**
   * Updates the app UI font family, injects the CSS `font-family` value onto
   * `<html>` and `<body>`, and triggers an async font load for non-system fonts.
   */
  setAppFontFamily: (family: AppFontFamily) => void;
  /** Sets `fontSize`, clamped to the range 14–28 px. */
  setFontSize: (size: number) => void;
  /** Sets `lineHeight`, clamped to the range 1.4–2.2. */
  setLineHeight: (height: number) => void;
  setTextSizeScale: (scale: TextSizeScale) => void;
  setLetterSpacing: (v: LetterSpacing) => void;
  setWordSpacing: (v: WordSpacing) => void;
  setParagraphSpacing: (v: ParagraphSpacing) => void;
  setTextAlignment: (v: TextAlignment) => void;
  setBodyFontWeight: (v: BodyFontWeight) => void;
  setTextIndent: (v: TextIndent) => void;
  /** Resets all typography settings to {@link DEFAULT_TYPOGRAPHY_SETTINGS} and persists the result. */
  resetTypography: () => void;
}

/** Factory defaults used both as the initial state and as the target for {@link TypographySlice.resetTypography}. */
export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  fontFamily: 'merriweather',
  appFontFamily: 'cascadia-code',
  fontSize: 18,
  lineHeight: 1.7,
  textSizeScale: 'base',
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  paragraphSpacing: 'normal',
  textAlignment: 'left',
  bodyFontWeight: 'normal',
  textIndent: 'none',
};

/**
 * Loads typography settings from localStorage. Tries the dedicated `typography-settings`
 * key first, then migrates from the legacy `reading-settings` key where these fields
 * were stored flat alongside background settings.
 */
export const loadTypographySettings = (): TypographySettings => {
  if (typeof window === 'undefined') return DEFAULT_TYPOGRAPHY_SETTINGS;

  const saved = localStorage.getItem(TYPOGRAPHY_STORAGE_KEY);
  if (saved) {
    const parsed = tryCatch(() => JSON.parse(saved), null);
    if (parsed) return { ...DEFAULT_TYPOGRAPHY_SETTINGS, ...parsed };
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    const parsed = tryCatch(() => JSON.parse(legacy), null);
    if (parsed && parsed.fontFamily !== undefined) {
      const migrated: TypographySettings = {
        fontFamily: parsed.fontFamily ?? DEFAULT_TYPOGRAPHY_SETTINGS.fontFamily,
        appFontFamily: parsed.appFontFamily ?? DEFAULT_TYPOGRAPHY_SETTINGS.appFontFamily,
        fontSize: parsed.fontSize ?? DEFAULT_TYPOGRAPHY_SETTINGS.fontSize,
        lineHeight: parsed.lineHeight ?? DEFAULT_TYPOGRAPHY_SETTINGS.lineHeight,
        textSizeScale: parsed.textSizeScale ?? DEFAULT_TYPOGRAPHY_SETTINGS.textSizeScale,
        letterSpacing: parsed.letterSpacing ?? DEFAULT_TYPOGRAPHY_SETTINGS.letterSpacing,
        wordSpacing: parsed.wordSpacing ?? DEFAULT_TYPOGRAPHY_SETTINGS.wordSpacing,
        paragraphSpacing: parsed.paragraphSpacing ?? DEFAULT_TYPOGRAPHY_SETTINGS.paragraphSpacing,
        textAlignment: parsed.textAlignment ?? DEFAULT_TYPOGRAPHY_SETTINGS.textAlignment,
        bodyFontWeight: parsed.bodyFontWeight ?? DEFAULT_TYPOGRAPHY_SETTINGS.bodyFontWeight,
        textIndent: parsed.textIndent ?? DEFAULT_TYPOGRAPHY_SETTINGS.textIndent,
      };
      localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return DEFAULT_TYPOGRAPHY_SETTINGS;
};

const initialTypography = loadTypographySettings();

if (typeof window !== 'undefined') {
  loadFont(initialTypography.fontFamily).catch((error) => {
    console.error('Failed to preload initial font:', error);
  });

  const appFontCss = APP_FONT_CSS_MAP[initialTypography.appFontFamily];
  if (appFontCss) {
    document.documentElement.style.fontFamily = appFontCss;
    document.body.style.fontFamily = appFontCss;
  }

  if (
    initialTypography.appFontFamily !== 'geist' &&
    initialTypography.appFontFamily !== 'system-ui'
  ) {
    loadFont(initialTypography.appFontFamily as FontFamily).catch(() => {});
  }
}

/**
 * Merges a partial typography update into the current state and synchronously
 * persists the result to `localStorage`.
 *
 * @param set - Zustand `set` function from the slice's `StateCreator`.
 * @param patch - Pure function that receives the current `TypographySettings` and
 *   returns the fields to change. Returning an empty object is a no-op on state
 *   but still writes to `localStorage`.
 */
const patchTypography = (
  set: Parameters<StateCreator<TypographySlice>>[0],
  patch: (s: TypographySettings) => Partial<TypographySettings>
) =>
  set((state) => {
    const newTypography = { ...state.typography, ...patch(state.typography) };
    localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(newTypography));
    return { typography: newTypography };
  });

/**
 * Zustand `StateCreator` for the typography slice. Intended to be spread into a
 * combined store via `create<CombinedStore>()((...args) => ({ ...createTypographySlice(...args) }))`.
 *
 * On first call, state is hydrated from `localStorage` via {@link loadTypographySettings}.
 * The initial font and app-font are pre-loaded in the module-level side-effect block above.
 */
export const createTypographySlice: StateCreator<TypographySlice, [], [], TypographySlice> = (
  set
) => ({
  typography: initialTypography,

  setFontFamily: (family) =>
    patchTypography(set, (s) => {
      loadFont(family);
      const supported = getSupportedBodyWeights(family);
      const patch: Partial<TypographySettings> = { fontFamily: family };
      if (!supported.includes(s.bodyFontWeight)) {
        patch.bodyFontWeight = 'normal';
      }
      return patch;
    }),

  setAppFontFamily: (family) =>
    patchTypography(set, () => {
      if (family !== 'geist' && family !== 'system-ui') {
        loadFont(family as FontFamily);
      }
      document.documentElement.style.fontFamily = APP_FONT_CSS_MAP[family];
      document.body.style.fontFamily = APP_FONT_CSS_MAP[family];
      return { appFontFamily: family };
    }),

  setFontSize: (size) => patchTypography(set, () => ({ fontSize: clamp(14, 28, size) })),
  setLineHeight: (height) => patchTypography(set, () => ({ lineHeight: clamp(1.4, 2.2, height) })),
  setTextSizeScale: (scale) => patchTypography(set, () => ({ textSizeScale: scale })),
  setLetterSpacing: (v) => patchTypography(set, () => ({ letterSpacing: v })),
  setWordSpacing: (v) => patchTypography(set, () => ({ wordSpacing: v })),
  setParagraphSpacing: (v) => patchTypography(set, () => ({ paragraphSpacing: v })),
  setTextAlignment: (v) => patchTypography(set, () => ({ textAlignment: v })),
  setBodyFontWeight: (v) => patchTypography(set, () => ({ bodyFontWeight: v })),
  setTextIndent: (v) => patchTypography(set, () => ({ textIndent: v })),
  resetTypography: () => patchTypography(set, () => ({ ...DEFAULT_TYPOGRAPHY_SETTINGS })),
});
