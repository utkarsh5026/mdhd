import { createImageExportStore } from './create-image-export-store';
import type { SharedExportSettings } from './types';

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
  customHeight: 0,
  aspectRatio: 'auto',

  // Shared — 3D perspective
  perspectiveEnabled: false,
  perspective: 1000,
  rotateX: 0,
  rotateY: 0,

  // Shared — gradient border
  gradientBorderEnabled: false,
  gradientBorderWidth: 3,
  gradientBorderColorStart: '#ff6b6b',
  gradientBorderColorEnd: '#4ecdc4',
  gradientBorderAngle: 135,

  // Shared — device frame
  deviceFrame: 'none',

  // Shared — annotations
  annotations: [],

  // Shared — watermark
  watermarkText: '',
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 50,
  watermarkColor: '#ffffff',
  watermarkSize: 11,
  watermarkFontFamily: 'system-ui, sans-serif',
  watermarkX: -1,
  watermarkY: -1,

  // Shared — content positioning
  contentOffsetX: 0,
  contentOffsetY: 0,
  contentScale: 1,

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

export const usePhotoImageExportStore = createImageExportStore(
  defaultPhotoSettings,
  'photo-image-export-settings'
);
