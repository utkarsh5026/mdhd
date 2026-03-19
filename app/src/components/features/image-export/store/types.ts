/** Settings shared by both code and photo image export. */
export interface SharedExportSettings {
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

  // Pattern overlay (applied on top of any background type)
  backgroundPatternEnabled: boolean;
  backgroundPattern:
    | 'dots'
    | 'polka'
    | 'grid'
    | 'diagonal'
    | 'cross-hatch'
    | 'hexagons'
    | 'waves'
    | 'checkerboard'
    | 'circles'
    | 'noise';
  backgroundPatternColor: string;
  backgroundPatternOpacity: number;
  backgroundPatternScale: number;

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
  watermarkColor: string;
  watermarkSize: number;
  watermarkFontFamily: string;

  // Export
  exportScale: number;
}

export interface SavedPreset<T = unknown> {
  name: string;
  settings: T;
}

// --- Section key groups ---

export const BACKGROUND_KEYS = [
  'backgroundType',
  'backgroundColor',
  'backgroundColorEnd',
  'gradientAngle',
  'backgroundImage',
  'backgroundImageOpacity',
  'backgroundImageOverlay',
  'backgroundImageOverlayOpacity',
  'backgroundImageFit',
  'transparentBackground',
  'backgroundPatternEnabled',
  'backgroundPattern',
  'backgroundPatternColor',
  'backgroundPatternOpacity',
  'backgroundPatternScale',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const LAYOUT_KEYS = [
  'padding',
  'customWidth',
  'aspectRatio',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const WATERMARK_KEYS = [
  'watermarkText',
  'watermarkPosition',
  'watermarkOpacity',
  'watermarkColor',
  'watermarkSize',
  'watermarkFontFamily',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const EXPORT_KEYS = [
  'exportScale',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const WINDOW_KEYS = [
  'windowStyle',
  'windowFocused',
  'titleText',
  'titlePosition',
  'showTitleIcon',
  'titleBarFrosted',
  'windowAccentColor',
  'showMenuBar',
  'showDock',
  'showTaskbar',
  'borderRadius',
  'shadowSize',
] as const;

export const CODE_KEYS = [
  'themeKey',
  'fontFamily',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'fontLigatures',
  'showLineNumbers',
] as const;

export const LINE_HIGHLIGHT_KEYS = [
  'highlightedLines',
  'highlightColor',
  'dimUnhighlighted',
  'dimOpacity',
] as const;

export const FILTER_KEYS = [
  'brightness',
  'contrast',
  'saturation',
  'blur',
  'grayscale',
  'sepia',
  'hueRotate',
  'invert',
  'vignette',
  'sharpen',
  'noise',
  'tintColor',
  'tintOpacity',
] as const;

export const FRAME_KEYS = [
  'frameBorderWidth',
  'frameBorderColor',
  'frameBorderStyle',
  'innerBorderRadius',
  'shadowSize',
] as const;

export const CAPTION_KEYS = [
  'captionText',
  'captionDescription',
  'captionPosition',
  'captionFontFamily',
  'captionFontSize',
  'captionFontWeight',
  'captionAlignment',
  'captionMaxWidth',
  'captionColor',
  'captionBackground',
] as const;

/** Pick a subset of keys from an object. */
export function pickKeys<T extends object>(obj: T, keys: readonly (keyof T)[]): Partial<T> {
  const result = {} as Partial<T>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
