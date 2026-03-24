import type React from 'react';
import { useMemo } from 'react';

import { buildPatternBackground } from '../components/pattern-backgrounds';
import type { PhotoImageExportSettings } from '../store/photo-image-export-store';
import {
  ASPECT_RATIO_MAP,
  PHOTO_PREVIEW_MIN_WIDTH,
  sanitizeBackgroundImageUrl,
  SHADOW_MAP,
} from '../utils/constants';

const FONT_WEIGHT_MAP: Record<string, number> = {
  light: 300,
  normal: 400,
  bold: 700,
};

/**
 * Builds a CSS `filter` string from image adjustment settings.
 *
 * Only includes filter functions whose values differ from their defaults
 * (100 for brightness/contrast/saturation, 0 for everything else).
 * Sharpen is approximated via an additional `contrast()` bump.
 *
 * @param settings - The full photo image export settings.
 * @returns A space-separated CSS filter string, or `'none'` if no filters apply.
 */
function buildFilterStyle(settings: PhotoImageExportSettings): string {
  const parts: string[] = [];
  if (settings.brightness !== 100) parts.push(`brightness(${settings.brightness}%)`);
  if (settings.contrast !== 100) parts.push(`contrast(${settings.contrast}%)`);
  if (settings.saturation !== 100) parts.push(`saturate(${settings.saturation}%)`);
  if (settings.blur > 0) parts.push(`blur(${settings.blur}px)`);
  if (settings.grayscale > 0) parts.push(`grayscale(${settings.grayscale}%)`);
  if (settings.sepia > 0) parts.push(`sepia(${settings.sepia}%)`);
  if (settings.hueRotate > 0) parts.push(`hue-rotate(${settings.hueRotate}deg)`);
  if (settings.invert > 0) parts.push(`invert(${settings.invert}%)`);
  if (settings.sharpen > 0) {
    const amount = 1 + settings.sharpen / 200;
    parts.push(`contrast(${amount * 100}%)`);
  }
  return parts.join(' ') || 'none';
}

/**
 * Resolves the outer container's CSS `background` value.
 *
 * Returns `'transparent'`, a solid color, a `linear-gradient`, or `undefined`
 * (when an image background is active and handled separately).
 *
 * @param settings - The full photo image export settings.
 * @param isImageBg - Whether a sanitized background image URL is in use.
 * @returns A CSS background string, or `undefined` for image backgrounds.
 */
function buildOuterBackground(
  settings: PhotoImageExportSettings,
  isImageBg: boolean
): string | undefined {
  if (settings.transparentBackground) return 'transparent';
  if (isImageBg) return undefined;
  if (settings.backgroundType === 'gradient') {
    return `linear-gradient(${settings.gradientAngle}deg, ${settings.backgroundColor}, ${settings.backgroundColorEnd})`;
  }
  return settings.backgroundColor;
}

/**
 * Builds `background-repeat` and `background-size` properties for image backgrounds.
 *
 * Returns `undefined` when no image background is active. Supports `'tile'`
 * (repeating) and standard CSS `background-size` values like `'cover'`/`'contain'`.
 *
 * @param settings - The full photo image export settings.
 * @param isImageBg - Whether a sanitized background image URL is in use.
 * @returns CSS properties for image fitting, or `undefined` if not applicable.
 */
function buildImageFitStyle(
  settings: PhotoImageExportSettings,
  isImageBg: boolean
): React.CSSProperties | undefined {
  if (!isImageBg) return undefined;
  if (settings.backgroundImageFit === 'tile') {
    return { backgroundRepeat: 'repeat', backgroundSize: 'auto' };
  }
  return { backgroundRepeat: 'no-repeat', backgroundSize: settings.backgroundImageFit };
}

/**
 * Builds the outer container style including background, dimensions,
 * aspect ratio, padding, and optional 3D perspective transform.
 *
 * @param settings - The full photo image export settings.
 * @param outerBackground - Pre-computed CSS background value from `buildOuterBackground`.
 * @returns Complete CSS properties for the outer preview wrapper.
 */
function buildOuterStyle(
  settings: PhotoImageExportSettings,
  outerBackground: string | undefined
): React.CSSProperties {
  const style: React.CSSProperties = {
    background: outerBackground,
    padding: settings.padding,
  };

  if (settings.customWidth > 0) style.width = `${settings.customWidth}px`;
  else style.minWidth = PHOTO_PREVIEW_MIN_WIDTH;

  if (settings.customHeight > 0) style.height = `${settings.customHeight}px`;

  if (ASPECT_RATIO_MAP[settings.aspectRatio]) {
    style.aspectRatio = ASPECT_RATIO_MAP[settings.aspectRatio];
    style.minHeight = 0;
  }

  if (settings.perspectiveEnabled) {
    style.transform = `perspective(${settings.perspective}px) rotateX(${settings.rotateX}deg) rotateY(${settings.rotateY}deg)`;
  }

  return style;
}

/**
 * Builds CSS properties for the caption text overlay or below-image caption.
 *
 * Includes font family, size, weight, alignment, color, and optional max-width.
 *
 * @param settings - The full photo image export settings.
 * @returns CSS properties for caption text styling.
 */
function buildCaptionStyle(settings: PhotoImageExportSettings): React.CSSProperties {
  const style: React.CSSProperties = {
    fontFamily: settings.captionFontFamily,
    fontSize: `${settings.captionFontSize}px`,
    fontWeight: FONT_WEIGHT_MAP[settings.captionFontWeight] ?? 400,
    textAlign: settings.captionAlignment,
    color: settings.captionColor,
  };

  if (settings.captionMaxWidth > 0) style.maxWidth = `${settings.captionMaxWidth}px`;

  return style;
}

/**
 * Builds the gradient border wrapper style with a linear-gradient background,
 * padding (acting as border width), and adjusted border-radius.
 *
 * @param settings - The full photo image export settings.
 * @returns CSS properties for the gradient border, or `undefined` if disabled.
 */
function buildGradientBorderStyle(
  settings: PhotoImageExportSettings
): React.CSSProperties | undefined {
  if (!settings.gradientBorderEnabled) return undefined;
  return {
    background: `linear-gradient(${settings.gradientBorderAngle}deg, ${settings.gradientBorderColorStart}, ${settings.gradientBorderColorEnd})`,
    padding: `${settings.gradientBorderWidth}px`,
    borderRadius: `${settings.innerBorderRadius + settings.gradientBorderWidth}px`,
  };
}

/**
 * Builds the photo frame's border-radius, box-shadow, and optional solid border.
 *
 * Box-shadow is omitted when a gradient border is active (the gradient wrapper
 * handles the visual border instead).
 *
 * @param settings - The full photo image export settings.
 * @returns CSS properties for the inner photo frame container.
 */
function buildPhotoFrameStyle(settings: PhotoImageExportSettings): React.CSSProperties {
  const style: React.CSSProperties = {
    borderRadius: `${settings.innerBorderRadius}px`,
  };

  if (!settings.gradientBorderEnabled) style.boxShadow = SHADOW_MAP[settings.shadowSize];

  if (settings.frameBorderWidth > 0) {
    style.border = `${settings.frameBorderWidth}px ${settings.frameBorderStyle} ${settings.frameBorderColor}`;
  }

  return style;
}

/**
 * Builds the absolutely-positioned watermark text style.
 *
 * Positioning coordinates are not included here — they come from
 * `WATERMARK_POSITION_STYLES` and are merged at the call site.
 *
 * @param settings - The full photo image export settings.
 * @returns CSS properties for the watermark text element.
 */
function buildWatermarkStyle(settings: PhotoImageExportSettings): React.CSSProperties {
  return {
    position: 'absolute',
    opacity: settings.watermarkOpacity / 100,
    fontSize: `${settings.watermarkSize}px`,
    color: settings.watermarkColor,
    fontFamily: settings.watermarkFontFamily,
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 10,
  };
}

/**
 * Orchestrates all style builders for the photo image export preview.
 *
 * Memoizes expensive computations (CSS filter string, pattern background)
 * and delegates each visual concern to a focused pure builder function.
 *
 * @hook
 * @param settings - The full photo image export settings.
 * @returns Pre-computed style objects and derived flags for the preview component.
 */
export function usePhotoImageStyles(settings: PhotoImageExportSettings) {
  const filterStyle = useMemo(() => buildFilterStyle(settings), [settings]);

  const safeBgImage = sanitizeBackgroundImageUrl(settings.backgroundImage);
  const isImageBg = settings.backgroundType === 'image' && !!safeBgImage;

  const patternBgStyle = useMemo(
    () =>
      settings.backgroundPatternEnabled && !settings.transparentBackground
        ? buildPatternBackground(
            settings.backgroundPattern,
            settings.backgroundPatternColor,
            settings.backgroundPatternOpacity,
            settings.backgroundPatternScale
          )
        : undefined,
    [settings]
  );

  const innerBorderRadiusResolved =
    settings.frameBorderWidth > 0 ? 0 : `${settings.innerBorderRadius}px`;

  return {
    safeBgImage,
    isImageBg,
    imageFitStyle: buildImageFitStyle(settings, isImageBg),
    patternBgStyle,
    outerStyle: buildOuterStyle(settings, buildOuterBackground(settings, isImageBg)),
    isOverlayCaption: settings.captionPosition !== 'below',
    captionStyle: buildCaptionStyle(settings),
    gradientBorderStyle: buildGradientBorderStyle(settings),
    photoFrameStyle: buildPhotoFrameStyle(settings),
    imageStyle: {
      filter: filterStyle,
      borderRadius: innerBorderRadiusResolved,
    } as React.CSSProperties,
    innerBorderRadiusResolved,
    watermarkStyle: buildWatermarkStyle(settings),
  };
}
