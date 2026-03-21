import type { StoreApi } from 'zustand';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import type { TextSizeScale } from '@/components/features/markdown-render/utils/text-size-classes';
import type { FontFamily } from '@/lib/font';
import { loadFont } from '@/lib/font-loader';
import { tryCatch } from '@/utils/functions/error';

const STORAGE_KEY = 'reading-settings';

const clamp = (min: number, max: number, value: number) => Math.min(max, Math.max(min, value));

export type { TextSizeScale };

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

/** The full set of user-configurable reading preferences persisted to localStorage. */
export interface ReadingSettings {
  fontFamily: FontFamily;
  background: ReadingBackgroundSettings;
  backgroundImageId: string | null;
  fontSize: number; // 14-28px
  lineHeight: number; // 1.4-2.2
  contentWidth: number; // 500-900px
  bionicReading: boolean;
  sentenceFocusOnHover: boolean;
  textSizeScale: TextSizeScale;
}

interface ReadingSettingsState {
  settings: ReadingSettings;
  setFontFamily: (family: FontFamily) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setContentWidth: (width: number) => void;
  toggleBionicReading: () => void;
  toggleSentenceFocusOnHover: () => void;
  setTextSizeScale: (scale: TextSizeScale) => void;
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
  fontFamily: 'merriweather',
  background: DEFAULT_BACKGROUND,
  backgroundImageId: null,
  // Typography defaults
  fontSize: 18,
  lineHeight: 1.7,
  contentWidth: 700,
  bionicReading: false,
  sentenceFocusOnHover: false,
  textSizeScale: 'base',
};

/**
 * Loads reading settings from localStorage and merges them with `DEFAULT_SETTINGS`.
 *
 * Handles three edge cases: SSR (no `window`), missing key, and invalid JSON.
 * Also deep-merges `background` so new fields added to `DEFAULT_BACKGROUND` are
 * always present, and strips the legacy `customBackground` field.
 *
 * @returns The merged `ReadingSettings` to use as the store's initial state.
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

  // Remove legacy field
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { customBackground, ...rest } = parsed;

  return { ...DEFAULT_SETTINGS, ...rest, background };
};

const initialSettings = loadInitialSettings();
if (typeof window !== 'undefined') {
  loadFont(initialSettings.fontFamily).catch((error) => {
    console.error('Failed to preload initial font:', error);
  });
}

/**
 * Applies a partial patch to `settings`, persists the result to localStorage,
 * and returns the new store slice — eliminating the boilerplate repeated in every action.
 *
 * @param set - The Zustand `setState` function from the store creator.
 * @param patch - A function that receives the current settings and returns the fields to update.
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

export const useReadingSettingsStore = create<ReadingSettingsState>((set) => ({
  settings: initialSettings,

  setFontFamily: (family: FontFamily) =>
    patchSettings(set, () => {
      loadFont(family);
      return { fontFamily: family };
    }),

  setFontSize: (size: number) => patchSettings(set, () => ({ fontSize: clamp(14, 28, size) })),

  setLineHeight: (height: number) =>
    patchSettings(set, () => ({ lineHeight: clamp(1.4, 2.2, height) })),

  setContentWidth: (width: number) =>
    patchSettings(set, () => ({ contentWidth: clamp(500, 900, width) })),

  toggleBionicReading: () => patchSettings(set, (s) => ({ bionicReading: !s.bionicReading })),

  toggleSentenceFocusOnHover: () =>
    patchSettings(set, (s) => ({ sentenceFocusOnHover: !s.sentenceFocusOnHover })),

  setTextSizeScale: (scale: TextSizeScale) => patchSettings(set, () => ({ textSizeScale: scale })),

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
}));

/**
 * Hook to access reading settings with optimized re-renders.
 * Uses shallow comparison to prevent unnecessary re-renders.
 */
export const useReadingSettings = () => {
  return useReadingSettingsStore(
    useShallow((state) => ({
      settings: state.settings,
      setFontFamily: state.setFontFamily,
      setFontSize: state.setFontSize,
      setLineHeight: state.setLineHeight,
      setContentWidth: state.setContentWidth,
      toggleBionicReading: state.toggleBionicReading,
      toggleSentenceFocusOnHover: state.toggleSentenceFocusOnHover,
      setTextSizeScale: state.setTextSizeScale,
      updateBackground: state.updateBackground,
      setBackgroundImageId: state.setBackgroundImageId,
      clearBackgroundImage: state.clearBackgroundImage,
      resetSettings: state.resetSettings,
    }))
  );
};
