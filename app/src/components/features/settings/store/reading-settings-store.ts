import type { StoreApi } from 'zustand';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { clamp } from '@/lib/utils';
import { tryCatch } from '@/utils/error';

import { type BackgroundSlice, createBackgroundSlice } from './background-slice';
import type { TtsSettingsSlice } from './tts-slice';
import { createTtsSlice } from './tts-slice';
import type { TypographySlice } from './typography-slice';
import { createTypographySlice } from './typography-slice';

const STORAGE_KEY = 'reading-settings';

export type {
  ReadingBackgroundFit,
  ReadingBackgroundSettings,
  ReadingBackgroundType,
} from './background-slice';
export type { TextSizeScale } from './typography-slice';
export type {
  BodyFontWeight,
  LetterSpacing,
  ParagraphSpacing,
  TextAlignment,
  TextIndent,
  WordSpacing,
} from './typography-slice';

/** Reading display and interaction settings (layout and reading features). */
export interface ReadingSettings {
  /** Maximum width (in px) of the reading content column. Clamped to 500–900. */
  contentWidth: number;
  /** When `true`, bold prefixes are applied to words to aid rapid reading (Bionic Reading technique). */
  bionicReading: boolean;
  /** When `true`, hovering over a sentence highlights it to reduce surrounding visual noise. */
  sentenceFocusOnHover: boolean;
}

interface ReadingSettingsState {
  settings: ReadingSettings;
  setContentWidth: (width: number) => void;
  toggleBionicReading: () => void;
  toggleSentenceFocusOnHover: () => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  contentWidth: 700,
  bionicReading: false,
  sentenceFocusOnHover: false,
};

/** Loads layout/reading-feature settings from localStorage. */
const loadInitialSettings = (): ReadingSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  const savedSettings = localStorage.getItem(STORAGE_KEY);
  if (!savedSettings) return DEFAULT_SETTINGS;

  const parsed = tryCatch(() => JSON.parse(savedSettings), null);
  if (!parsed) return DEFAULT_SETTINGS;

  return {
    contentWidth: parsed.contentWidth ?? DEFAULT_SETTINGS.contentWidth,
    bionicReading: parsed.bionicReading ?? DEFAULT_SETTINGS.bionicReading,
    sentenceFocusOnHover: parsed.sentenceFocusOnHover ?? DEFAULT_SETTINGS.sentenceFocusOnHover,
  };
};

/**
 * Applies a partial update to `ReadingSettings`, persists the new value to localStorage, and
 * commits it to Zustand state in a single atomic update.
 *
 * @param set - Zustand `setState` bound to `ReadingSettingsState`.
 * @param patch - Pure function that receives the current settings and returns the fields to merge.
 */
const patchSettings = (
  set: StoreApi<ReadingSettingsState>['setState'],
  patch: (s: ReadingSettings) => Partial<ReadingSettings>
) =>
  set((state) => {
    const newSettings = { ...state.settings, ...patch(state.settings) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    return { settings: newSettings };
  });

/**
 * Combined Zustand store that merges reading display settings ({@link ReadingSettingsState}),
 * background settings ({@link BackgroundSlice}), text-to-speech settings ({@link TtsSettingsSlice}),
 * and typography settings ({@link TypographySlice}) into a single store instance.
 *
 * Prefer the pre-built selector hooks ({@link useTypography}, {@link useReadingDisplay},
 * `useTtsSettings`) over consuming this store directly — they are shallow-compared and avoid
 * unnecessary re-renders.
 */
export const useReadingSettingsStore = create<
  ReadingSettingsState & BackgroundSlice & TtsSettingsSlice & TypographySlice
>()((...a) => {
  const [set] = a;
  return {
    ...createTtsSlice(...(a as Parameters<typeof createTtsSlice>)),
    ...createTypographySlice(...(a as Parameters<typeof createTypographySlice>)),
    ...createBackgroundSlice(...(a as Parameters<typeof createBackgroundSlice>)),
    settings: loadInitialSettings(),

    setContentWidth: (width) =>
      patchSettings(set, () => ({ contentWidth: clamp(500, 900, width) })),

    toggleBionicReading: () => patchSettings(set, (s) => ({ bionicReading: !s.bionicReading })),

    toggleSentenceFocusOnHover: () =>
      patchSettings(set, (s) => ({ sentenceFocusOnHover: !s.sentenceFocusOnHover })),

    resetSettings: () =>
      set(() => {
        localStorage.removeItem(STORAGE_KEY);
        return { settings: DEFAULT_SETTINGS };
      }),
  };
});

/** Selects all typography state and setters. Shallow-compared to prevent unnecessary re-renders. */
export const useTypography = () =>
  useReadingSettingsStore(
    useShallow((state) => ({
      typography: state.typography,
      setFontFamily: state.setFontFamily,
      setAppFontFamily: state.setAppFontFamily,
      setFontSize: state.setFontSize,
      setLineHeight: state.setLineHeight,
      setTextSizeScale: state.setTextSizeScale,
      setLetterSpacing: state.setLetterSpacing,
      setWordSpacing: state.setWordSpacing,
      setParagraphSpacing: state.setParagraphSpacing,
      setTextAlignment: state.setTextAlignment,
      setBodyFontWeight: state.setBodyFontWeight,
      setTextIndent: state.setTextIndent,
      resetTypography: state.resetTypography,
    }))
  );

/**
 *  Selects display/layout settings and their actions. Shallow-compared to prevent unnecessary re-renders.
 */
export const useReadingDisplay = () =>
  useReadingSettingsStore(
    useShallow((state) => ({
      settings: state.settings,
      setContentWidth: state.setContentWidth,
      toggleBionicReading: state.toggleBionicReading,
      toggleSentenceFocusOnHover: state.toggleSentenceFocusOnHover,
      resetSettings: state.resetSettings,
    }))
  );
