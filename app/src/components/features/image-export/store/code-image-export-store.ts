import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ThemeKey } from '@/components/features/settings/store/code-theme';

export interface CodeImageExportSettings {
  // Background
  backgroundType: 'gradient' | 'solid' | 'image';
  backgroundColor: string;
  backgroundColorEnd: string;
  gradientAngle: number;
  backgroundImage: string;
  backgroundImageOpacity: number;
  backgroundImageOverlay: string;
  backgroundImageOverlayOpacity: number;
  backgroundImageFit: 'cover' | 'contain' | 'fill' | 'tile';
  transparentBackground: boolean;

  // Window
  windowStyle: 'macos' | 'windows' | 'none';
  titleText: string;

  // Code
  themeKey: ThemeKey;
  fontFamily: string;
  fontSize: number;
  fontLigatures: boolean;
  lineHeight: number;
  letterSpacing: number;
  showLineNumbers: boolean;

  // Line highlight
  highlightedLines: string;
  highlightColor: string;
  dimUnhighlighted: boolean;
  dimOpacity: number;

  // Layout
  padding: number;
  borderRadius: number;
  shadowSize: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  customWidth: number;
  aspectRatio: 'auto' | '16:9' | '4:3' | '1:1' | '9:16';

  // Watermark
  watermarkText: string;
  watermarkPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  watermarkOpacity: number;

  // Export
  exportScale: number;
}

export const defaultSettings: CodeImageExportSettings = {
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

  windowStyle: 'macos',
  titleText: '',

  themeKey: 'vscDarkPlus',
  fontFamily: 'Source Code Pro',
  fontSize: 16,
  fontLigatures: true,
  lineHeight: 1.6,
  letterSpacing: 0,
  showLineNumbers: true,

  highlightedLines: '',
  highlightColor: 'rgba(255,255,100,0.15)',
  dimUnhighlighted: false,
  dimOpacity: 40,

  padding: 64,
  borderRadius: 12,
  shadowSize: 'lg',
  customWidth: 0,
  aspectRatio: 'auto',

  watermarkText: '',
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 50,

  exportScale: 2,
};

export interface SavedPreset {
  name: string;
  settings: CodeImageExportSettings;
}

const MAX_HISTORY = 50;

interface CodeImageExportStore {
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
  resetSettings: () => void;

  // Presets
  presets: SavedPreset[];
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;

  // Undo / Redo
  history: CodeImageExportSettings[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useCodeImageExportStore = create<CodeImageExportStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      history: [defaultSettings],
      historyIndex: 0,
      presets: [],

      updateSettings: (partial: Partial<CodeImageExportSettings>) => {
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
            defaultSettings,
          ].slice(-MAX_HISTORY);
          return {
            settings: defaultSettings,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        });
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

      deletePreset: (name: string) => {
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
      name: 'code-image-export-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        presets: state.presets,
      }),
    }
  )
);

/**
 * Parses a line-range string like "1,3-5,8" into an array of 1-based line numbers.
 */
export function parseHighlightedLines(input: string | undefined): number[] {
  if (!input?.trim()) return [];
  const lines: number[] = [];
  for (const part of input.split(',')) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
        lines.push(i);
      }
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n)) lines.push(n);
    }
  }
  return [...new Set(lines)].sort((a, b) => a - b);
}
