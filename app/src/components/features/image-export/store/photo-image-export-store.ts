import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SavedPreset, SharedExportSettings } from './types';

export interface PhotoImageExportSettings extends SharedExportSettings {
  // Filters
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  invert: number;

  // Effects
  vignette: number;
  sharpen: number;
  noise: number;
  tintColor: string;
  tintOpacity: number;

  // Frame / border
  frameBorderWidth: number;
  frameBorderColor: string;
  frameBorderStyle: 'solid' | 'double' | 'groove' | 'ridge';
  innerBorderRadius: number;

  // Caption
  captionText: string;
  captionDescription: string;
  captionPosition: 'below' | 'overlay-bottom' | 'overlay-top';
  captionFontFamily: string;
  captionFontSize: number;
  captionFontWeight: 'light' | 'normal' | 'bold';
  captionAlignment: 'left' | 'center' | 'right';
  captionMaxWidth: number;
  captionColor: string;
  captionBackground: string;
}

export const defaultPhotoSettings: PhotoImageExportSettings = {
  // Shared — background
  backgroundType: 'gradient',
  backgroundColor: '#A689E1',
  backgroundColorEnd: '#5BA4CF',
  gradientAngle: 135,
  backgroundImage: '',
  backgroundImageOpacity: 100,
  backgroundImageOverlay: '#000000',
  backgroundImageOverlayOpacity: 0,
  backgroundImageFit: 'cover',
  transparentBackground: false,

  // Shared — pattern overlay
  backgroundPatternEnabled: false,
  backgroundPattern: 'dots',
  backgroundPatternColor: '#ffffff',
  backgroundPatternOpacity: 20,
  backgroundPatternScale: 1,

  // Shared — layout
  padding: 48,
  borderRadius: 12,
  shadowSize: 'lg',
  customWidth: 0,
  aspectRatio: 'auto',

  // Shared — watermark
  watermarkText: '',
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 50,
  watermarkColor: '#ffffff',
  watermarkSize: 11,
  watermarkFontFamily: 'system-ui, sans-serif',

  // Shared — export
  exportScale: 2,

  // Filters
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,

  // Effects
  vignette: 0,
  sharpen: 0,
  noise: 0,
  tintColor: '#ff8800',
  tintOpacity: 0,

  // Frame
  frameBorderWidth: 0,
  frameBorderColor: '#ffffff',
  frameBorderStyle: 'solid',
  innerBorderRadius: 8,

  // Caption
  captionText: '',
  captionDescription: '',
  captionPosition: 'below',
  captionFontFamily: 'system-ui, sans-serif',
  captionFontSize: 13,
  captionFontWeight: 'normal',
  captionAlignment: 'center',
  captionMaxWidth: 0,
  captionColor: '#ffffff',
  captionBackground: 'rgba(0,0,0,0.6)',
};

const MAX_HISTORY = 50;

interface PhotoImageExportStore {
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
  resetSettings: () => void;

  presets: SavedPreset<PhotoImageExportSettings>[];
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;

  history: PhotoImageExportSettings[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const usePhotoImageExportStore = create<PhotoImageExportStore>()(
  persist(
    (set, get) => ({
      settings: defaultPhotoSettings,
      history: [defaultPhotoSettings],
      historyIndex: 0,
      presets: [],

      updateSettings: (partial) => {
        set((state) => {
          const newSettings = { ...state.settings, ...partial };
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newSettings].slice(
            -MAX_HISTORY
          );
          return {
            settings: newSettings,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      resetSettings: () => {
        set((state) => {
          const newHistory = [
            ...state.history.slice(0, state.historyIndex + 1),
            defaultPhotoSettings,
          ].slice(-MAX_HISTORY);
          return {
            settings: defaultPhotoSettings,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
      },

      savePreset: (name) => {
        set((state) => {
          const filtered = state.presets.filter((p) => p.name !== name);
          return { presets: [...filtered, { name, settings: { ...state.settings } }] };
        });
      },

      loadPreset: (name) => {
        const preset = get().presets.find((p) => p.name === name);
        if (preset) {
          set((state) => {
            const newHistory = [
              ...state.history.slice(0, state.historyIndex + 1),
              preset.settings,
            ].slice(-MAX_HISTORY);
            return {
              settings: { ...preset.settings },
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          });
        }
      },

      deletePreset: (name) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.name !== name),
        }));
      },

      undo: () => {
        set((state) => {
          if (state.historyIndex <= 0) return state;
          const newIndex = state.historyIndex - 1;
          return { settings: state.history[newIndex], historyIndex: newIndex };
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          const newIndex = state.historyIndex + 1;
          return { settings: state.history[newIndex], historyIndex: newIndex };
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }),
    {
      name: 'photo-image-export-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        presets: state.presets,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        settings: {
          ...defaultPhotoSettings,
          ...((persisted as { settings?: Partial<PhotoImageExportSettings> })?.settings ?? {}),
        },
      }),
    }
  )
);
