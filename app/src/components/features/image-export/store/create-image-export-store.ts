import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SavedPreset, SharedExportSettings } from './types';

const MAX_HISTORY = 50;

/**
 * Shape of the Zustand store created by `createImageExportStore`.
 *
 * Manages export settings, a named preset library, and a bounded undo/redo history.
 * The history excludes `backgroundImage` to avoid persisting large data URLs.
 *
 * @template T - The concrete settings type extending `SharedExportSettings`.
 */
export interface ImageExportStore<T extends SharedExportSettings> {
  settings: T;
  updateSettings: (partial: Partial<T>) => void;
  resetSettings: () => void;

  presets: SavedPreset<T>[];
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;

  history: T[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/**
 * Appends `entry` to the history array after the current cursor position and trims to
 * `MAX_HISTORY` entries. Any entries after the cursor (i.e. undone steps) are discarded.
 *
 * @param state - Current store state, used to read `history` and `historyIndex`.
 * @param entry - The settings snapshot to push onto the history stack.
 * @returns Partial state update containing the new `history` array and `historyIndex`.
 */
function pushHistory<T extends SharedExportSettings>(state: ImageExportStore<T>, entry: T) {
  const newHistory = [...state.history.slice(0, state.historyIndex + 1), entry].slice(-MAX_HISTORY);
  return { history: newHistory, historyIndex: newHistory.length - 1 };
}

/**
 * Moves the history cursor by `delta` steps and returns the settings at the new position.
 * Returns the unchanged state if the resulting index would be out of bounds.
 *
 * @param state - Current store state, used to read `history` and `historyIndex`.
 * @param delta - Number of steps to move. Use `-1` for undo, `+1` for redo.
 * @returns Partial state update with the new `settings` and `historyIndex`, or the full
 *   unchanged state if the move is out of bounds.
 */
function navigateHistory<T extends SharedExportSettings>(
  state: ImageExportStore<T>,
  delta: number
) {
  const newIndex = state.historyIndex + delta;
  if (newIndex < 0 || newIndex >= state.history.length) return state;
  return { settings: state.history[newIndex], historyIndex: newIndex };
}

/**
 * Factory that creates a persisted Zustand store for image export settings.
 *
 * The store provides:
 * - **Settings** — current export configuration, merged with `defaults` on rehydration.
 * - **Presets** — named snapshots of settings that can be saved, loaded, and deleted.
 * - **Undo/redo** — bounded history (up to `MAX_HISTORY` entries); `backgroundImage` is
 *   stripped from history and persisted state to avoid storing large data URLs.
 *
 * @template T - The concrete settings type extending `SharedExportSettings`.
 * @param defaults - Default settings used for initial state and `resetSettings`.
 * @param storageName - `localStorage` key used by the Zustand `persist` middleware.
 * @returns A Zustand store hook typed as `ImageExportStore<T>`.
 */
export function createImageExportStore<T extends SharedExportSettings>(
  defaults: T,
  storageName: string
) {
  return create<ImageExportStore<T>>()(
    persist(
      (set, get) => ({
        settings: defaults,
        history: [defaults],
        historyIndex: 0,
        presets: [],

        updateSettings: (partial: Partial<T>) => {
          set((state) => {
            const newSettings = { ...state.settings, ...partial };
            return {
              settings: newSettings,
              ...pushHistory(state, { ...newSettings, backgroundImage: '' }),
            };
          });
        },

        resetSettings: () => {
          set((state) => ({
            settings: defaults,
            ...pushHistory(state, defaults),
          }));
        },

        savePreset: (name: string) => {
          set((state) => {
            const filtered = state.presets.filter((p) => p.name !== name);
            return { presets: [...filtered, { name, settings: { ...state.settings } }] };
          });
        },

        loadPreset: (name: string) => {
          const preset = get().presets.find((p) => p.name === name);
          if (preset) {
            set((state) => ({
              settings: { ...preset.settings },
              ...pushHistory(state, preset.settings),
            }));
          }
        },

        deletePreset: (name: string) => {
          set((state) => ({
            presets: state.presets.filter((p) => p.name !== name),
          }));
        },

        undo: () => set((state) => navigateHistory(state, -1)),
        redo: () => set((state) => navigateHistory(state, 1)),

        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,
      }),
      {
        name: storageName,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          settings: { ...state.settings, backgroundImage: '' },
          presets: state.presets.map((p) => ({
            ...p,
            settings: { ...p.settings, backgroundImage: '' },
          })),
        }),
        merge: (persisted, current) => ({
          ...current,
          ...(persisted as object),
          settings: {
            ...defaults,
            ...((persisted as { settings?: Partial<T> })?.settings ?? {}),
          },
        }),
      }
    )
  );
}
