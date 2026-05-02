import type { StateCreator } from 'zustand';

import { clamp } from '@/lib/utils';
import { tryCatch } from '@/utils/error';

const TTS_STORAGE_KEY = 'tts-settings';
const LEGACY_STORAGE_KEY = 'reading-settings';

/**
 * Persistent configuration for the text-to-speech narration feature.
 * Serialized to localStorage under the `tts-settings` key.
 */
export interface TtsSettings {
  /** Playback rate passed to the Web Speech API. Clamped to the range `0.5`–`2.0`. */
  speed: number;
  /** Name of the chosen `SpeechSynthesisVoice`. An empty string delegates to the system default. */
  voiceName: string;
  /** When `true`, the reader automatically advances to the next section after narration finishes. */
  autoAdvance: boolean;
}

/**
 * Zustand slice that owns TTS settings state and the actions that mutate it.
 * Each action immediately persists changes to localStorage via {@link patchTts}.
 */
export interface TtsSettingsSlice {
  /** Current TTS configuration. Initialized from localStorage on first load. */
  tts: TtsSettings;
  /**
   * Sets the TTS playback speed, clamped to the valid range `[0.5, 2.0]`.
   * @param speed - Desired playback rate.
   */
  setTtsSpeed: (speed: number) => void;
  /**
   * Sets the voice used for narration by its `SpeechSynthesisVoice.name`.
   * Pass an empty string to restore the system default.
   * @param name - Voice name, or `''` for the system default.
   */
  setTtsVoiceName: (name: string) => void;
  /** Toggles the `autoAdvance` flag between `true` and `false`. */
  toggleTtsAutoAdvance: () => void;
}

/** Baseline TTS configuration applied when no persisted settings are found. */
export const DEFAULT_TTS_SETTINGS: TtsSettings = {
  speed: 1.0,
  voiceName: '',
  autoAdvance: true,
};

/**
 * Loads TTS settings from localStorage. Tries the dedicated `tts-settings` key
 * first, then falls back to migrating from the legacy `reading-settings` key
 * (where `ttsSpeed`, `ttsVoiceName`, `ttsAutoAdvance` were stored flat).
 */
export const loadTtsSettings = (): TtsSettings => {
  if (typeof window === 'undefined') return DEFAULT_TTS_SETTINGS;

  const saved = localStorage.getItem(TTS_STORAGE_KEY);
  if (saved) {
    const parsed = tryCatch(() => JSON.parse(saved), null);
    if (parsed) return { ...DEFAULT_TTS_SETTINGS, ...parsed };
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    const parsed = tryCatch(() => JSON.parse(legacy), null);
    if (parsed && (parsed.ttsSpeed !== undefined || parsed.ttsVoiceName !== undefined)) {
      const migrated: TtsSettings = {
        speed: parsed.ttsSpeed ?? DEFAULT_TTS_SETTINGS.speed,
        voiceName: parsed.ttsVoiceName ?? DEFAULT_TTS_SETTINGS.voiceName,
        autoAdvance: parsed.ttsAutoAdvance ?? DEFAULT_TTS_SETTINGS.autoAdvance,
      };
      localStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }

  return DEFAULT_TTS_SETTINGS;
};

/**
 * Applies a partial update to the TTS settings in the Zustand store and synchronously
 * persists the merged result to localStorage.
 *
 * @param set - Zustand `set` function for the slice.
 * @param patch - Pure function that receives the current settings and returns fields to overwrite.
 */
const patchTts = (
  set: Parameters<StateCreator<TtsSettingsSlice>>[0],
  patch: (s: TtsSettings) => Partial<TtsSettings>
) =>
  set((state) => {
    const newTts = { ...state.tts, ...patch(state.tts) };
    localStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(newTts));
    return { tts: newTts };
  });

/**
 * Zustand `StateCreator` factory for the TTS settings slice.
 * Initializes state from localStorage via {@link loadTtsSettings} and wires up
 * the three mutating actions, each of which persists changes immediately.
 *
 * @example
 * ```ts
 * const useStore = create<TtsSettingsSlice>()(createTtsSlice);
 * const { tts, setTtsSpeed } = useStore();
 * setTtsSpeed(1.5);
 * ```
 */
export const createTtsSlice: StateCreator<TtsSettingsSlice, [], [], TtsSettingsSlice> = (set) => ({
  tts: loadTtsSettings(),

  setTtsSpeed: (speed) => patchTts(set, () => ({ speed: clamp(0.5, 2.0, speed) })),

  setTtsVoiceName: (name) => patchTts(set, () => ({ voiceName: name })),

  toggleTtsAutoAdvance: () => patchTts(set, (s) => ({ autoAdvance: !s.autoAdvance })),
});
