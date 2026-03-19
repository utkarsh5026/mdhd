import React, { forwardRef, useMemo } from 'react';

import { cn } from '@/lib/utils';

import { useImageDataUrl } from '../hooks/use-image-data-url';
import type { PhotoImageExportSettings } from '../store/photo-image-export-store';

const ASPECT_RATIO_MAP: Record<string, string | undefined> = {
  auto: undefined,
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
};

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
  md: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  lg: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
  xl: '0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.04)',
};

const WATERMARK_POSITION_STYLES: Record<
  PhotoImageExportSettings['watermarkPosition'],
  React.CSSProperties
> = {
  'bottom-right': { bottom: 12, right: 16 },
  'bottom-left': { bottom: 12, left: 16 },
  'top-right': { top: 12, right: 16 },
  'top-left': { top: 12, left: 16 },
};

interface PhotoImagePreviewProps {
  src: string;
  alt: string;
  settings: PhotoImageExportSettings;
}

const PhotoImagePreview = forwardRef<HTMLDivElement, PhotoImagePreviewProps>(
  ({ src, alt, settings }, ref) => {
    const {
      backgroundType,
      backgroundColor,
      backgroundColorEnd,
      gradientAngle,
      backgroundImage,
      backgroundImageOpacity,
      backgroundImageOverlay,
      backgroundImageOverlayOpacity,
      backgroundImageFit,
      transparentBackground,
      padding,
      shadowSize,
      customWidth,
      aspectRatio,
      watermarkText,
      watermarkPosition,
      watermarkOpacity,
      watermarkColor,
      watermarkSize,
      watermarkFontFamily,
      brightness,
      contrast,
      saturation,
      blur,
      grayscale,
      sepia,
      hueRotate,
      invert,
      frameBorderWidth,
      frameBorderColor,
      frameBorderStyle,
      innerBorderRadius,
      captionText,
      captionPosition,
      captionFontSize,
      captionColor,
      captionBackground,
    } = settings;

    const imageSrc = useImageDataUrl(src);

    const filterStyle = useMemo(() => {
      const parts: string[] = [];
      if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
      if (contrast !== 100) parts.push(`contrast(${contrast}%)`);
      if (saturation !== 100) parts.push(`saturate(${saturation}%)`);
      if (blur > 0) parts.push(`blur(${blur}px)`);
      if (grayscale > 0) parts.push(`grayscale(${grayscale}%)`);
      if (sepia > 0) parts.push(`sepia(${sepia}%)`);
      if (hueRotate > 0) parts.push(`hue-rotate(${hueRotate}deg)`);
      if (invert > 0) parts.push(`invert(${invert}%)`);
      return parts.join(' ') || 'none';
    }, [brightness, contrast, saturation, blur, grayscale, sepia, hueRotate, invert]);

    const isImageBg = backgroundType === 'image' && backgroundImage;

    const outerBackground = transparentBackground
      ? 'transparent'
      : isImageBg
        ? undefined
        : backgroundType === 'gradient'
          ? `linear-gradient(${gradientAngle}deg, ${backgroundColor}, ${backgroundColorEnd})`
          : backgroundColor;

    const imageFitStyle: React.CSSProperties | undefined = isImageBg
      ? backgroundImageFit === 'tile'
        ? { backgroundRepeat: 'repeat', backgroundSize: 'auto' }
        : { backgroundRepeat: 'no-repeat', backgroundSize: backgroundImageFit }
      : undefined;

    const outerStyle: React.CSSProperties = {
      background: outerBackground,
      padding,
      ...(customWidth > 0 ? { width: `${customWidth}px` } : { minWidth: '320px' }),
      ...(ASPECT_RATIO_MAP[aspectRatio]
        ? { aspectRatio: ASPECT_RATIO_MAP[aspectRatio], minHeight: 0 }
        : {}),
    };

    const displayCaption = captionText || alt;
    const showCaption = !!displayCaption;
    const isOverlayCaption = captionPosition !== 'below';

    return (
      <div
        ref={ref}
        style={outerStyle}
        className="relative overflow-hidden flex flex-col items-center justify-center rounded-2xl"
      >
        {/* Image background layers */}
        {isImageBg && !transparentBackground && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${backgroundImage})`,
                backgroundPosition: 'center',
                opacity: backgroundImageOpacity / 100,
                ...imageFitStyle,
              }}
            />
            {backgroundImageOverlayOpacity > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: backgroundImageOverlay,
                  opacity: backgroundImageOverlayOpacity / 100,
                }}
              />
            )}
          </>
        )}

        {/* Photo frame */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: `${innerBorderRadius}px`,
            boxShadow: SHADOW_MAP[shadowSize],
            ...(frameBorderWidth > 0
              ? {
                  border: `${frameBorderWidth}px ${frameBorderStyle} ${frameBorderColor}`,
                }
              : {}),
          }}
        >
          {/* Image with filters */}
          <img
            src={imageSrc}
            alt={alt}
            className="block max-w-full h-auto"
            style={{
              filter: filterStyle,
              borderRadius: frameBorderWidth > 0 ? 0 : `${innerBorderRadius}px`,
            }}
          />

          {/* Overlay caption */}
          {showCaption && isOverlayCaption && (
            <div
              className={cn(
                'absolute left-0 right-0 px-3 py-2',
                captionPosition === 'overlay-top' ? 'top-0' : 'bottom-0'
              )}
              style={{
                background: captionBackground,
                fontSize: `${captionFontSize}px`,
                color: captionColor,
              }}
            >
              {displayCaption}
            </div>
          )}
        </div>

        {/* Below caption */}
        {showCaption && !isOverlayCaption && (
          <div
            className="mt-2 text-center w-full px-2"
            style={{
              fontSize: `${captionFontSize}px`,
              color: captionColor,
            }}
          >
            {displayCaption}
          </div>
        )}

        {/* Watermark */}
        {watermarkText && (
          <div
            style={{
              position: 'absolute',
              ...WATERMARK_POSITION_STYLES[watermarkPosition],
              opacity: watermarkOpacity / 100,
              fontSize: `${watermarkSize}px`,
              color: watermarkColor,
              fontFamily: watermarkFontFamily,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 10,
            }}
          >
            {watermarkText}
          </div>
        )}
      </div>
    );
  }
);

PhotoImagePreview.displayName = 'PhotoImagePreview';

export default PhotoImagePreview;
