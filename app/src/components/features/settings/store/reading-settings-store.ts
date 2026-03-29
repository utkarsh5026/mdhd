import type { StoreApi } from 'zustand';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { clamp } from '@/lib/utils';
import { tryCatch } from '@/utils/error';

import type { TtsSettingsSlice } from './tts-slice';
import { createTtsSlice } from './tts-slice';
import type { TypographySlice } from './typography-slice';
import { createTypographySlice } from './typography-slice';

const STORAGE_KEY = 'reading-settings';

// Re-export typography types so existing imports from this module continue to work
export type { TextSizeScale } from './typography-slice';
export type {
  BodyFontWeight,
  LetterSpacing,
  ParagraphSpacing,
  TextAlignment,
  TextIndent,
  WordSpacing,
} from './typography-slice';

/** Controls which background source is active in reading mode. */
export type ReadingBackgroundType = 'theme' | 'solid' | 'image';
/** CSS `object-fit` mode (plus `tile`) used when a background image is active. */
export type ReadingBackgroundFit = 'cover' | 'contain' | 'fill' | 'tile';

/**
 * All configurable background properties for reading mode.
 *
 * When `backgroundType` is `'theme'` the background color fields are ignored
 * and the active app theme drives the canvas color. When `'solid'`, only
 * `backgroundColor` applies. When `'image'`, the image fields take effect.
 */
export interface ReadingBackgroundSettings {
  backgroundType: ReadingBackgroundType;
  backgroundColor: string;
  backgroundImageFit: ReadingBackgroundFit;
  backgroundImageOpacity: number; // 10-100
  backgroundImageBlur: number; // 0-20px
  backgroundImageOverlay: string;
  backgroundImageOverlayOpacity: number; // 0-80
}

/** Reading display and interaction settings (background, layout, reading features). */
export interface ReadingSettings {
  background: ReadingBackgroundSettings;
  /** IndexedDB key of the image file currently used as the reading background, or `null` when none is set. */
  backgroundImageId: string | null;
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
  updateBackground: (partial: Partial<ReadingBackgroundSettings>) => void;
  setBackgroundImageId: (id: string | null) => void;
  clearBackgroundImage: () => void;
  resetSettings: () => void;
}

const DEFAULT_BACKGROUND: ReadingBackgroundSettings = {
  backgroundType: 'theme',
  backgroundColor: '',
  backgroundImageFit: 'cover',
  backgroundImageOpacity: 100,
  backgroundImageBlur: 0,
  backgroundImageOverlay: '#000000',
  backgroundImageOverlayOpacity: 0,
};

const DEFAULT_SETTINGS: ReadingSettings = {
  background: DEFAULT_BACKGROUND,
  backgroundImageId: null,
  contentWidth: 700,
  bionicReading: false,
  sentenceFocusOnHover: false,
};

/**
 * Loads reading settings (background, layout, reading features) from localStorage.
 * Deep-merges `background` so new fields added to `DEFAULT_BACKGROUND` are always present.
 */
const loadInitialSettings = (): ReadingSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  const savedSettings = localStorage.getItem(STORAGE_KEY);
  if (!savedSettings) return DEFAULT_SETTINGS;

  const parsed = tryCatch(() => JSON.parse(savedSettings), null);
  if (!parsed) return DEFAULT_SETTINGS;

  const background = parsed.background
    ? { ...DEFAULT_BACKGROUND, ...parsed.background }
    : DEFAULT_BACKGROUND;

  return {
    background,
    backgroundImageId: parsed.backgroundImageId ?? null,
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
 * text-to-speech settings ({@link TtsSettingsSlice}), and typography settings
 * ({@link TypographySlice}) into a single store instance.
 *
 * Initial state is hydrated from localStorage via {@link loadInitialSettings}. All mutating
 * actions persist their changes back to localStorage automatically through `patchSettings`.
 *
 * Prefer the pre-built selector hooks ({@link useTypography}, {@link useReadingDisplay},
 * `useTtsSettings`) over consuming this store directly — they are shallow-compared and avoid
 * unnecessary re-renders.
 */
export const useReadingSettingsStore = create<
  ReadingSettingsState & TtsSettingsSlice & TypographySlice
>()((...a) => {
  const [set] = a;
  return {
    ...createTtsSlice(...(a as Parameters<typeof createTtsSlice>)),
    ...createTypographySlice(...(a as Parameters<typeof createTypographySlice>)),
    settings: loadInitialSettings(),

    setContentWidth: (width) =>
      patchSettings(set, () => ({ contentWidth: clamp(500, 900, width) })),

    toggleBionicReading: () => patchSettings(set, (s) => ({ bionicReading: !s.bionicReading })),

    toggleSentenceFocusOnHover: () =>
      patchSettings(set, (s) => ({ sentenceFocusOnHover: !s.sentenceFocusOnHover })),

    updateBackground: (partial: Partial<ReadingBackgroundSettings>) =>
      patchSettings(set, (s) => ({ background: { ...s.background, ...partial } })),

    setBackgroundImageId: (id: string | null) =>
      patchSettings(set, () => ({ backgroundImageId: id })),

    clearBackgroundImage: () =>
      patchSettings(set, (s) => ({
        backgroundImageId: null,
        background: { ...s.background, backgroundType: 'theme' as const },
      })),

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
