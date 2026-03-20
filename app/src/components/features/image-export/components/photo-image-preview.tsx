import React, { forwardRef, useMemo } from 'react';

import { cn } from '@/lib/utils';

import { useImageDataUrl } from '../hooks/use-image-data-url';
import type { PhotoImageExportSettings } from '../store/photo-image-export-store';
import {
  ASPECT_RATIO_MAP,
  PHOTO_PREVIEW_MIN_WIDTH,
  sanitizeBackgroundImageUrl,
  SHADOW_MAP,
  WATERMARK_POSITION_STYLES,
} from '../utils/constants';
import { AnnotationOverlay } from './annotation-overlay';
import { DeviceFrameWrapper } from './device-frames';
import { buildPatternBackground } from './pattern-backgrounds';

const FONT_WEIGHT_MAP: Record<string, number> = {
  light: 300,
  normal: 400,
  bold: 700,
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
      backgroundPatternEnabled,
      backgroundPattern,
      backgroundPatternColor,
      backgroundPatternOpacity,
      backgroundPatternScale,
      transparentBackground,
      padding,
      shadowSize,
      customWidth,
      customHeight,
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
      vignette,
      sharpen,
      noise,
      tintColor,
      tintOpacity,
      frameBorderWidth,
      frameBorderColor,
      frameBorderStyle,
      innerBorderRadius,
      captionText,
      captionDescription,
      captionPosition,
      captionFontFamily,
      captionFontSize,
      captionFontWeight,
      captionAlignment,
      captionMaxWidth,
      captionColor,
      captionBackground,
      perspectiveEnabled,
      perspective,
      rotateX,
      rotateY,
      gradientBorderEnabled,
      gradientBorderWidth,
      gradientBorderColorStart,
      gradientBorderColorEnd,
      gradientBorderAngle,
      deviceFrame,
      annotations,
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
      if (sharpen > 0) {
        const amount = 1 + sharpen / 200;
        parts.push(`contrast(${amount * 100}%)`);
      }
      return parts.join(' ') || 'none';
    }, [brightness, contrast, saturation, blur, grayscale, sepia, hueRotate, invert, sharpen]);

    const safeBgImage = sanitizeBackgroundImageUrl(backgroundImage);
    const isImageBg = backgroundType === 'image' && safeBgImage;

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

    const patternBgStyle = useMemo(
      () =>
        backgroundPatternEnabled && !transparentBackground
          ? buildPatternBackground(
              backgroundPattern,
              backgroundPatternColor,
              backgroundPatternOpacity,
              backgroundPatternScale
            )
          : undefined,
      [
        backgroundPatternEnabled,
        transparentBackground,
        backgroundPattern,
        backgroundPatternColor,
        backgroundPatternOpacity,
        backgroundPatternScale,
      ]
    );

    const outerStyle: React.CSSProperties = {
      background: outerBackground,
      padding,
      ...(customWidth > 0 ? { width: `${customWidth}px` } : { minWidth: PHOTO_PREVIEW_MIN_WIDTH }),
      ...(customHeight > 0 ? { height: `${customHeight}px` } : {}),
      ...(ASPECT_RATIO_MAP[aspectRatio]
        ? { aspectRatio: ASPECT_RATIO_MAP[aspectRatio], minHeight: 0 }
        : {}),
      // 3D perspective transform
      ...(perspectiveEnabled
        ? {
            transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          }
        : {}),
    };

    const displayCaption = captionText || alt;
    const displayDescription = captionDescription;
    const showCaption = !!displayCaption;
    const isOverlayCaption = captionPosition !== 'below';

    const captionStyle: React.CSSProperties = {
      fontFamily: captionFontFamily,
      fontSize: `${captionFontSize}px`,
      fontWeight: FONT_WEIGHT_MAP[captionFontWeight] ?? 400,
      textAlign: captionAlignment,
      color: captionColor,
      ...(captionMaxWidth > 0 ? { maxWidth: `${captionMaxWidth}px` } : {}),
    };

    // Gradient border wrapper style
    const gradientBorderStyle: React.CSSProperties | undefined = gradientBorderEnabled
      ? {
          background: `linear-gradient(${gradientBorderAngle}deg, ${gradientBorderColorStart}, ${gradientBorderColorEnd})`,
          padding: `${gradientBorderWidth}px`,
          borderRadius: `${innerBorderRadius + gradientBorderWidth}px`,
        }
      : undefined;

    const photoFrame = (
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: `${innerBorderRadius}px`,
          boxShadow: gradientBorderEnabled ? undefined : SHADOW_MAP[shadowSize],
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

        {/* Vignette overlay */}
        {vignette > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: frameBorderWidth > 0 ? 0 : `${innerBorderRadius}px`,
              boxShadow: `inset 0 0 ${40 + vignette}px ${vignette / 2}px rgba(0,0,0,${vignette / 100})`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tint overlay */}
        {tintOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: tintColor,
              opacity: tintOpacity / 100,
              mixBlendMode: 'overlay',
              borderRadius: frameBorderWidth > 0 ? 0 : `${innerBorderRadius}px`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Noise/grain overlay */}
        {noise > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: frameBorderWidth > 0 ? 0 : `${innerBorderRadius}px`,
              opacity: noise / 100,
              pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Overlay caption */}
        {showCaption && isOverlayCaption && (
          <div
            className={cn(
              'absolute left-0 right-0 px-3 py-2',
              captionPosition === 'overlay-top' ? 'top-0' : 'bottom-0'
            )}
            style={{
              background: captionBackground,
              ...captionStyle,
            }}
          >
            <div
              style={
                captionMaxWidth > 0
                  ? {
                      maxWidth: `${captionMaxWidth}px`,
                      margin: captionAlignment === 'center' ? '0 auto' : undefined,
                      marginLeft: captionAlignment === 'right' ? 'auto' : undefined,
                    }
                  : undefined
              }
            >
              {displayCaption}
              {displayDescription && (
                <div
                  style={{
                    fontSize: `${Math.max(captionFontSize - 3, 9)}px`,
                    opacity: 0.7,
                    marginTop: '2px',
                  }}
                >
                  {displayDescription}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );

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
                backgroundImage: `url(${safeBgImage})`,
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

        {/* Pattern background overlay */}
        {patternBgStyle && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              ...patternBgStyle,
            }}
          />
        )}

        {/* Device frame wrapper + gradient border + photo frame */}
        <DeviceFrameWrapper frame={deviceFrame}>
          {gradientBorderStyle ? <div style={gradientBorderStyle}>{photoFrame}</div> : photoFrame}
        </DeviceFrameWrapper>

        {/* Below caption */}
        {showCaption && !isOverlayCaption && (
          <div className="mt-2 w-full px-2" style={captionStyle}>
            <div
              style={
                captionMaxWidth > 0
                  ? {
                      maxWidth: `${captionMaxWidth}px`,
                      margin: captionAlignment === 'center' ? '0 auto' : undefined,
                      marginLeft: captionAlignment === 'right' ? 'auto' : undefined,
                    }
                  : undefined
              }
            >
              {displayCaption}
              {displayDescription && (
                <div
                  style={{
                    fontSize: `${Math.max(captionFontSize - 3, 9)}px`,
                    opacity: 0.7,
                    marginTop: '2px',
                  }}
                >
                  {displayDescription}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Annotations */}
        <AnnotationOverlay annotations={annotations} />

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
