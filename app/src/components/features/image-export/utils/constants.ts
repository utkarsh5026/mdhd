import type React from 'react';

import type { SharedExportSettings } from '../store/types';

export const ASPECT_RATIO_MAP: Record<string, string | undefined> = {
  auto: undefined,
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
};

export const SHADOW_MAP: Record<string, string> = {
  none: '',
  sm: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  md: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  lg: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  xl: '0 25px 50px -12px rgba(0,0,0,0.25)',
};

export const WATERMARK_POSITION_STYLES: Record<
  SharedExportSettings['watermarkPosition'],
  React.CSSProperties
> = {
  'bottom-right': { bottom: 12, right: 16 },
  'bottom-left': { bottom: 12, left: 16 },
  'top-right': { top: 12, right: 16 },
  'top-left': { top: 12, left: 16 },
};

/** Min width when no custom width is set (code preview). */
export const CODE_PREVIEW_MIN_WIDTH = '480px';

/** Min width when no custom width is set (photo preview). */
export const PHOTO_PREVIEW_MIN_WIDTH = '320px';

const SAFE_BG_IMAGE_PROTOCOLS = /^(data:|blob:)/i;

/**
 * Sanitize a background image URL for use in CSS `url()`.
 * Only allows `data:` and `blob:` URIs to prevent CSS injection via tampered localStorage.
 */
export function sanitizeBackgroundImageUrl(url: string): string {
  if (!url) return '';
  return SAFE_BG_IMAGE_PROTOCOLS.test(url) ? url : '';
}
