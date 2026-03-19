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
