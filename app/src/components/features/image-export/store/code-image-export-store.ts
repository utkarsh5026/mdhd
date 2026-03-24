import type { ThemeKey } from '@/components/features/settings/store/code-theme';

import { createImageExportStore } from './create-image-export-store';
import type { SharedExportSettings } from './types';

export type { SavedPreset } from './types';

export interface CodeImageExportSettings extends SharedExportSettings {
  // Window
  windowStyle: 'macos' | 'windows' | 'linux-gnome' | 'linux-kde' | 'retro-terminal' | 'none';
  windowFocused: boolean;
  titleText: string;
  titlePosition: 'center' | 'left' | 'right';
  showTitleIcon: boolean;
  titleBarFrosted: boolean;
  windowAccentColor: string;

  // Desktop Chrome
  showMenuBar: boolean;
  showDock: boolean;
  showTaskbar: boolean;
  showGnomeTopBar: boolean;
  showGnomeDash: boolean;
  showKdePanel: boolean;

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

  backgroundPatternEnabled: false,
  backgroundPattern: 'dots',
  backgroundPatternColor: '#ffffff',
  backgroundPatternOpacity: 20,
  backgroundPatternScale: 1,

  windowStyle: 'macos',
  windowFocused: true,
  titleText: '',
  titlePosition: 'center',
  showTitleIcon: true,
  titleBarFrosted: false,
  windowAccentColor: '#0078d4',

  showMenuBar: false,
  showDock: false,
  showTaskbar: false,
  showGnomeTopBar: false,
  showGnomeDash: false,
  showKdePanel: false,

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
  customHeight: 0,
  aspectRatio: 'auto',

  perspectiveEnabled: false,
  perspective: 1000,
  rotateX: 0,
  rotateY: 0,

  gradientBorderEnabled: false,
  gradientBorderWidth: 3,
  gradientBorderColorStart: '#ff6b6b',
  gradientBorderColorEnd: '#4ecdc4',
  gradientBorderAngle: 135,

  deviceFrame: 'none',

  annotations: [],

  watermarkText: '',
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 50,
  watermarkColor: '#ffffff',
  watermarkSize: 11,
  watermarkFontFamily: 'system-ui, sans-serif',
  watermarkX: -1,
  watermarkY: -1,

  contentOffsetX: 0,
  contentOffsetY: 0,
  contentScaleX: 1,
  contentScaleY: 1,

  exportScale: 2,
};

export const useCodeImageExportStore = createImageExportStore(
  defaultSettings,
  'code-image-export-settings'
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
      if (Math.abs(end - start) > 10000) continue;
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
