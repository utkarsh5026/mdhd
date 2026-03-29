import type { StateCreator } from 'zustand';

import { patch } from '@/lib/store-utils';
import { tryCatch } from '@/utils/error';

const BACKGROUND_STORAGE_KEY = 'background-settings';
const LEGACY_STORAGE_KEY = 'reading-settings';

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

/**
 * Zustand slice that owns reading-mode background state and actions.
 * Serialized to localStorage under the `background-settings` key.
 */
export interface BackgroundSlice {
  /** Current background configuration. */
  background: ReadingBackgroundSettings;
  /** IndexedDB key of the image currently used as the reading background, or `null`. */
  backgroundImageId: string | null;
  /** Applies a partial update to the background configuration. */
  updateBackground: (partial: Partial<ReadingBackgroundSettings>) => void;
  /** Sets (or clears) the IndexedDB key for the background image. */
  setBackgroundImageId: (id: string | null) => void;
  /** Clears the background image and resets `backgroundType` to `'theme'`. */
  clearBackgroundImage: () => void;
}

export const DEFAULT_BACKGROUND: ReadingBackgroundSettings = {
  backgroundType: 'theme',
  backgroundColor: '',
  backgroundImageFit: 'cover',
  backgroundImageOpacity: 100,
  backgroundImageBlur: 0,
  backgroundImageOverlay: '#000000',
  backgroundImageOverlayOpacity: 0,
};

/**
 * Loads background settings from localStorage. Tries the dedicated
 * `background-settings` key first, then falls back to migrating from the
 * legacy `reading-settings` key (where these fields were stored nested under
 * `background`).
 */
export const loadBackgroundSettings = (): {
  background: ReadingBackgroundSettings;
  backgroundImageId: string | null;
} => {
  if (typeof window === 'undefined') {
    return { background: DEFAULT_BACKGROUND, backgroundImageId: null };
  }

  const saved = localStorage.getItem(BACKGROUND_STORAGE_KEY);
  if (saved) {
    const parsed = tryCatch(() => JSON.parse(saved), null);
    if (parsed) {
      return {
        background: patch(DEFAULT_BACKGROUND, parsed.background ?? {}),
        backgroundImageId: parsed.backgroundImageId ?? null,
      };
    }
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    const parsed = tryCatch(() => JSON.parse(legacy), null);
    if (parsed?.background) {
      const migrated = {
        background: patch(DEFAULT_BACKGROUND, parsed.background),
        backgroundImageId: parsed.backgroundImageId ?? null,
      };
      localStorage.setItem(BACKGROUND_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return { background: DEFAULT_BACKGROUND, backgroundImageId: null };
};

const persist = (
  set: Parameters<StateCreator<BackgroundSlice>>[0],
  patchFn: (s: BackgroundSlice) => Partial<BackgroundSlice>
) =>
  set((state) => {
    const next = { ...state, ...patchFn(state) };
    localStorage.setItem(
      BACKGROUND_STORAGE_KEY,
      JSON.stringify({ background: next.background, backgroundImageId: next.backgroundImageId })
    );
    return patchFn(state);
  });

/**
 * Zustand `StateCreator` factory for the background settings slice.
 * Initializes state from localStorage via {@link loadBackgroundSettings}.
 */
export const createBackgroundSlice: StateCreator<BackgroundSlice, [], [], BackgroundSlice> = (
  set
) => {
  const initial = loadBackgroundSettings();
  return {
    ...initial,

    updateBackground: (partial) =>
      persist(set, (s) => ({ background: patch(s.background, partial) })),

    setBackgroundImageId: (id) => persist(set, () => ({ backgroundImageId: id })),

    clearBackgroundImage: () =>
      persist(set, (s) => ({
        backgroundImageId: null,
        background: patch(s.background, { backgroundType: 'theme' as const }),
      })),
  };
};
