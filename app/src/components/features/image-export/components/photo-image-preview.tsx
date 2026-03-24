import React, { useCallback, useRef } from 'react';

import { useImageDataUrl } from '../hooks/use-image-data-url';
import { usePhotoImageStyles } from '../hooks/use-photo-image-styles';
import type { PhotoImageExportSettings } from '../store/photo-image-export-store';
import type { Annotation, SharedExportSettings } from '../store/types';
import { WATERMARK_POSITION_STYLES } from '../utils/constants';
import { DeviceFrameWrapper } from './device-frames/index';
import {
  BackgroundImageLayers,
  ContentDragWrapper,
  InteractiveOverlay,
  NoiseOverlay,
  OverlayCaption,
  PatternBackgroundLayer,
  StaticExportOverlay,
  TintOverlay,
  VignetteOverlay,
} from './overlays';

interface PhotoImagePreviewProps {
  src: string;
  alt: string;
  settings: PhotoImageExportSettings;
  onAnnotationUpdate?: (id: string, partial: Partial<Annotation>) => void;
  onSettingsUpdate?: (partial: Partial<SharedExportSettings>) => void;
  ref?: React.Ref<HTMLDivElement>;
}

const PhotoImagePreview = ({
  src,
  alt,
  settings,
  onAnnotationUpdate,
  onSettingsUpdate,
  ref,
}: PhotoImagePreviewProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  const interactive = !!onAnnotationUpdate && !!onSettingsUpdate;

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref]
  );

  const imageSrc = useImageDataUrl(src);

  const {
    safeBgImage,
    isImageBg,
    imageFitStyle,
    patternBgStyle,
    outerStyle,
    isOverlayCaption,
    captionStyle,
    gradientBorderStyle,
    photoFrameStyle,
    imageStyle,
    innerBorderRadiusResolved,
    watermarkStyle,
  } = usePhotoImageStyles(settings);

  const displayCaption = settings.captionText || alt;
  const displayDescription = settings.captionDescription;
  const showCaption = !!displayCaption;

  const captionMaxWidthStyle =
    settings.captionMaxWidth > 0
      ? {
          maxWidth: `${settings.captionMaxWidth}px`,
          margin: settings.captionAlignment === 'center' ? '0 auto' : undefined,
          marginLeft: settings.captionAlignment === 'right' ? 'auto' : undefined,
        }
      : undefined;

  const descriptionStyle = displayDescription
    ? {
        fontSize: `${Math.max(settings.captionFontSize - 3, 9)}px`,
        opacity: 0.7,
        marginTop: '2px',
      }
    : undefined;

  const photoFrame = (
    <div className="relative overflow-hidden" style={photoFrameStyle}>
      {/* Image with filters */}
      <img src={imageSrc} alt={alt} className="block max-w-full h-auto" style={imageStyle} />

      {settings.vignette > 0 && (
        <VignetteOverlay vignette={settings.vignette} borderRadius={innerBorderRadiusResolved} />
      )}
      {settings.tintOpacity > 0 && (
        <TintOverlay
          tintOpacity={settings.tintOpacity}
          tintColor={settings.tintColor}
          borderRadius={innerBorderRadiusResolved}
        />
      )}
      {settings.noise > 0 && (
        <NoiseOverlay noise={settings.noise} borderRadius={innerBorderRadiusResolved} />
      )}
      {showCaption && isOverlayCaption && (
        <OverlayCaption
          position={settings.captionPosition}
          background={settings.captionBackground}
          captionStyle={captionStyle}
          captionMaxWidthStyle={captionMaxWidthStyle}
          displayCaption={displayCaption}
          displayDescription={displayDescription}
          descriptionStyle={descriptionStyle}
        />
      )}
    </div>
  );

  return (
    <div
      ref={mergedRef}
      style={outerStyle}
      className="relative overflow-hidden flex flex-col items-center justify-center rounded-2xl"
    >
      {/* Image background layers */}
      <BackgroundImageLayers
        isImageBg={isImageBg}
        transparentBackground={settings.transparentBackground}
        safeBgImage={safeBgImage ?? ''}
        backgroundImageOpacity={settings.backgroundImageOpacity}
        imageFitStyle={imageFitStyle}
        backgroundImageOverlay={settings.backgroundImageOverlay}
        backgroundImageOverlayOpacity={settings.backgroundImageOverlayOpacity}
      />

      {/* Pattern background overlay */}
      <PatternBackgroundLayer patternBgStyle={patternBgStyle} />

      {/* Device frame wrapper + gradient border + photo frame */}
      {interactive ? (
        <ContentDragWrapper
          containerRef={localRef}
          offsetX={settings.contentOffsetX}
          offsetY={settings.contentOffsetY}
          scaleX={settings.contentScaleX}
          scaleY={settings.contentScaleY}
          resizable
          onUpdate={onSettingsUpdate}
        >
          <DeviceFrameWrapper frame={settings.deviceFrame}>
            {gradientBorderStyle ? <div style={gradientBorderStyle}>{photoFrame}</div> : photoFrame}
          </DeviceFrameWrapper>
        </ContentDragWrapper>
      ) : (
        <div
          style={
            settings.contentOffsetX ||
            settings.contentOffsetY ||
            settings.contentScaleX !== 1 ||
            settings.contentScaleY !== 1
              ? {
                  transform: `translate(${settings.contentOffsetX}px, ${settings.contentOffsetY}px) scale(${settings.contentScaleX}, ${settings.contentScaleY})`,
                  transformOrigin: 'center center',
                }
              : undefined
          }
        >
          <DeviceFrameWrapper frame={settings.deviceFrame}>
            {gradientBorderStyle ? <div style={gradientBorderStyle}>{photoFrame}</div> : photoFrame}
          </DeviceFrameWrapper>
        </div>
      )}

      {/* Below caption */}
      {showCaption && !isOverlayCaption && (
        <div className="mt-2 w-full px-2" style={captionStyle}>
          <div style={captionMaxWidthStyle}>
            {displayCaption}
            {displayDescription && <div style={descriptionStyle}>{displayDescription}</div>}
          </div>
        </div>
      )}

      {/* Annotations + Watermark: interactive or static */}
      {interactive ? (
        <InteractiveOverlay
          containerRef={localRef}
          annotations={settings.annotations}
          settings={settings}
          onAnnotationUpdate={onAnnotationUpdate}
          onSettingsUpdate={onSettingsUpdate}
        />
      ) : (
        <StaticExportOverlay
          annotations={settings.annotations}
          watermarkText={settings.watermarkText}
          watermarkStyle={
            settings.watermarkText
              ? { ...watermarkStyle, ...WATERMARK_POSITION_STYLES[settings.watermarkPosition] }
              : undefined
          }
        />
      )}
    </div>
  );
};

PhotoImagePreview.displayName = 'PhotoImagePreview';

export default PhotoImagePreview;
