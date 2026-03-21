import React from 'react';

import { cn } from '@/lib/utils';

import type { Annotation } from '../../store/types';
import { AnnotationOverlay } from './annotations/annotation-overlay';

interface BackgroundImageLayersProps {
  isImageBg: boolean;
  transparentBackground: boolean;
  safeBgImage: string;
  backgroundImageOpacity: number;
  imageFitStyle?: React.CSSProperties;
  backgroundImageOverlay: string;
  backgroundImageOverlayOpacity: number;
}

export const BackgroundImageLayers: React.FC<BackgroundImageLayersProps> = ({
  isImageBg,
  transparentBackground,
  safeBgImage,
  backgroundImageOpacity,
  imageFitStyle,
  backgroundImageOverlay,
  backgroundImageOverlayOpacity,
}) => {
  if (!isImageBg || transparentBackground) return null;

  return (
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
  );
};

interface PatternBackgroundLayerProps {
  patternBgStyle?: React.CSSProperties;
}

export const PatternBackgroundLayer: React.FC<PatternBackgroundLayerProps> = ({
  patternBgStyle,
}) => {
  if (!patternBgStyle) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        ...patternBgStyle,
      }}
    />
  );
};

interface StaticExportOverlayProps {
  annotations: Annotation[];
  watermarkText?: string;
  /** Complete style including position — merge WATERMARK_POSITION_STYLES at the call site. */
  watermarkStyle?: React.CSSProperties;
}

export const StaticExportOverlay: React.FC<StaticExportOverlayProps> = ({
  annotations,
  watermarkText,
  watermarkStyle,
}) => (
  <>
    <AnnotationOverlay annotations={annotations} />
    {watermarkText && watermarkStyle && <div style={watermarkStyle}>{watermarkText}</div>}
  </>
);

interface VignetteOverlayProps {
  vignette: number;
  borderRadius: string | number;
}

export const VignetteOverlay: React.FC<VignetteOverlayProps> = ({ vignette, borderRadius }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius,
      boxShadow: `inset 0 0 ${40 + vignette}px ${vignette / 2}px rgba(0,0,0,${vignette / 100})`,
      pointerEvents: 'none',
    }}
  />
);

interface TintOverlayProps {
  tintOpacity: number;
  tintColor: string;
  borderRadius: string | number;
}

export const TintOverlay: React.FC<TintOverlayProps> = ({
  tintOpacity,
  tintColor,
  borderRadius,
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: tintColor,
      opacity: tintOpacity / 100,
      mixBlendMode: 'overlay',
      borderRadius,
      pointerEvents: 'none',
    }}
  />
);

interface NoiseOverlayProps {
  noise: number;
  borderRadius: string | number;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({ noise, borderRadius }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius,
      opacity: noise / 100,
      pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'overlay',
    }}
  />
);

interface OverlayCaptionProps {
  position: string;
  background: string;
  captionStyle: React.CSSProperties;
  captionMaxWidthStyle: React.CSSProperties | undefined;
  displayCaption: string;
  displayDescription: string | undefined;
  descriptionStyle: React.CSSProperties | undefined;
}

export const OverlayCaption: React.FC<OverlayCaptionProps> = ({
  position,
  background,
  captionStyle,
  captionMaxWidthStyle,
  displayCaption,
  displayDescription,
  descriptionStyle,
}) => (
  <div
    className={cn(
      'absolute left-0 right-0 px-3 py-2',
      position === 'overlay-top' ? 'top-0' : 'bottom-0'
    )}
    style={{ background, ...captionStyle }}
  >
    <div style={captionMaxWidthStyle}>
      {displayCaption}
      {displayDescription && <div style={descriptionStyle}>{displayDescription}</div>}
    </div>
  </div>
);
