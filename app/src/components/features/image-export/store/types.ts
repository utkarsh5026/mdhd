/** A positioned annotation overlay on the exported image. */
export interface Annotation {
  id: string;
  type: 'label' | 'arrow' | 'numbered';
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
  fontSize: number;
  // Arrow-specific
  toX?: number; // percentage 0-100
  toY?: number; // percentage 0-100
}

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
  customHeight: number;
  aspectRatio: 'auto' | '16:9' | '4:3' | '1:1' | '9:16';

  // 3D Perspective Transform
  perspectiveEnabled: boolean;
  perspective: number;
  rotateX: number;
  rotateY: number;

  // Gradient Border
  gradientBorderEnabled: boolean;
  gradientBorderWidth: number;
  gradientBorderColorStart: string;
  gradientBorderColorEnd: string;
  gradientBorderAngle: number;

  // Device Frame
  deviceFrame:
    | 'none'
    | 'browser-chrome'
    | 'browser-arc'
    | 'iphone'
    | 'pixel'
    | 'macbook'
    | 'ipad'
    | 'apple-watch'
    | 'gnome'
    | 'social-card';

  // Annotations
  annotations: Annotation[];

  // Watermark
  watermarkText: string;
  watermarkPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  watermarkOpacity: number;
  watermarkColor: string;
  watermarkSize: number;
  watermarkFontFamily: string;
  /** Free-form X position (percentage 0-100). -1 = use watermarkPosition preset. */
  watermarkX: number;
  /** Free-form Y position (percentage 0-100). -1 = use watermarkPosition preset. */
  watermarkY: number;

  // Content positioning (interactive drag/resize of the main content within the background)
  /** Horizontal offset of the content in pixels (0 = centered). */
  contentOffsetX: number;
  /** Vertical offset of the content in pixels (0 = centered). */
  contentOffsetY: number;
  /** Scale factor for the content (1 = original size). Used for photo resize. */
  contentScale: number;

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
  'customHeight',
  'aspectRatio',
  'deviceFrame',
  'contentOffsetX',
  'contentOffsetY',
  'contentScale',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const PERSPECTIVE_KEYS = [
  'perspectiveEnabled',
  'perspective',
  'rotateX',
  'rotateY',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const GRADIENT_BORDER_KEYS = [
  'gradientBorderEnabled',
  'gradientBorderWidth',
  'gradientBorderColorStart',
  'gradientBorderColorEnd',
  'gradientBorderAngle',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const ANNOTATION_KEYS = [
  'annotations',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const WATERMARK_KEYS = [
  'watermarkText',
  'watermarkPosition',
  'watermarkOpacity',
  'watermarkColor',
  'watermarkSize',
  'watermarkFontFamily',
  'watermarkX',
  'watermarkY',
] as const satisfies readonly (keyof SharedExportSettings)[];

export const EXPORT_KEYS = [
  'exportScale',
] as const satisfies readonly (keyof SharedExportSettings)[];

/** Keys specific to code image export (window chrome). */
export type CodeWindowKey =
  | 'windowStyle'
  | 'windowFocused'
  | 'titleText'
  | 'titlePosition'
  | 'showTitleIcon'
  | 'titleBarFrosted'
  | 'windowAccentColor'
  | 'showMenuBar'
  | 'showDock'
  | 'showTaskbar'
  | 'showGnomeTopBar'
  | 'showGnomeDash'
  | 'showKdePanel'
  | 'borderRadius'
  | 'shadowSize';

/** Keys specific to code image export (code editor). */
export type CodeEditorKey =
  | 'themeKey'
  | 'fontFamily'
  | 'fontSize'
  | 'lineHeight'
  | 'letterSpacing'
  | 'fontLigatures'
  | 'showLineNumbers';

/** Keys specific to code image export (line highlights). */
export type LineHighlightKey =
  | 'highlightedLines'
  | 'highlightColor'
  | 'dimUnhighlighted'
  | 'dimOpacity';

/** Keys specific to photo image export (filters). */
export type PhotoFilterKey =
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'blur'
  | 'grayscale'
  | 'sepia'
  | 'hueRotate'
  | 'invert'
  | 'vignette'
  | 'sharpen'
  | 'noise'
  | 'tintColor'
  | 'tintOpacity';

/** Keys specific to photo image export (frame). */
export type PhotoFrameKey =
  | 'frameBorderWidth'
  | 'frameBorderColor'
  | 'frameBorderStyle'
  | 'innerBorderRadius'
  | 'shadowSize';

/** Keys specific to photo image export (caption). */
export type PhotoCaptionKey =
  | 'captionText'
  | 'captionDescription'
  | 'captionPosition'
  | 'captionFontFamily'
  | 'captionFontSize'
  | 'captionFontWeight'
  | 'captionAlignment'
  | 'captionMaxWidth'
  | 'captionColor'
  | 'captionBackground';

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
  'showGnomeTopBar',
  'showGnomeDash',
  'showKdePanel',
  'borderRadius',
  'shadowSize',
] as const satisfies readonly CodeWindowKey[];

export const CODE_KEYS = [
  'themeKey',
  'fontFamily',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'fontLigatures',
  'showLineNumbers',
] as const satisfies readonly CodeEditorKey[];

export const LINE_HIGHLIGHT_KEYS = [
  'highlightedLines',
  'highlightColor',
  'dimUnhighlighted',
  'dimOpacity',
] as const satisfies readonly LineHighlightKey[];

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
] as const satisfies readonly PhotoFilterKey[];

export const FRAME_KEYS = [
  'frameBorderWidth',
  'frameBorderColor',
  'frameBorderStyle',
  'innerBorderRadius',
  'shadowSize',
] as const satisfies readonly PhotoFrameKey[];

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
] as const satisfies readonly PhotoCaptionKey[];

/** Pick a subset of keys from an object. */
export function pickKeys<T extends object>(obj: T, keys: readonly (keyof T)[]): Partial<T> {
  const result = {} as Partial<T>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
