import { Minus, Square, X } from 'lucide-react';
import React, { forwardRef, useMemo } from 'react';

import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import type { ThemeKey } from '@/components/features/settings/store/code-theme';
import { getThemeBackground } from '@/components/features/settings/store/codemirror-themes';
import { cn } from '@/lib/utils';

import {
  type CodeImageExportSettings,
  parseHighlightedLines,
} from '../store/code-image-export-store';

const SHADOW_MAP: Record<CodeImageExportSettings['shadowSize'], string> = {
  none: '',
  sm: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  md: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  lg: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  xl: '0 25px 50px -12px rgba(0,0,0,0.25)',
};

const ASPECT_RATIO_MAP: Record<string, string | undefined> = {
  auto: undefined,
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '9:16': '9 / 16',
};

const WATERMARK_POSITION_STYLES: Record<
  CodeImageExportSettings['watermarkPosition'],
  React.CSSProperties
> = {
  'bottom-right': { bottom: 12, right: 16 },
  'bottom-left': { bottom: 12, left: 16 },
  'top-right': { top: 12, right: 16 },
  'top-left': { top: 12, left: 16 },
};

interface CodeImagePreviewProps {
  code: string;
  language: string;
  settings: CodeImageExportSettings;
}

const MacOSControls = () => (
  <div className="flex items-center gap-2">
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: '#FF5F57', boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.15)' }}
    />
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: '#FEBC2E', boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.15)' }}
    />
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: '#28C840', boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.15)' }}
    />
  </div>
);

const WindowsControls = () => (
  <div className="flex items-center ml-auto">
    <div className="flex items-center justify-center w-8 h-6 hover:bg-white/10 transition-colors">
      <Minus className="w-3 h-3 text-current opacity-50" />
    </div>
    <div className="flex items-center justify-center w-8 h-6 hover:bg-white/10 transition-colors">
      <Square className="w-2.5 h-2.5 text-current opacity-50" />
    </div>
    <div className="flex items-center justify-center w-8 h-6 rounded-tr-[inherit] hover:bg-[#e81123]/80 hover:text-white transition-colors">
      <X className="w-3 h-3 text-current opacity-50" />
    </div>
  </div>
);

const CodeImagePreview = forwardRef<HTMLDivElement, CodeImagePreviewProps>(
  ({ code, language, settings }, ref) => {
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
      windowStyle,
      titleText,
      padding,
      borderRadius,
      fontSize,
      fontFamily,
      fontLigatures,
      lineHeight,
      letterSpacing,
      shadowSize,
      showLineNumbers,
      themeKey,
      highlightedLines,
      highlightColor,
      dimUnhighlighted,
      dimOpacity,
      customWidth,
      aspectRatio,
      watermarkText,
      watermarkPosition,
      watermarkOpacity,
    } = settings;

    const themeBg = getThemeBackground(themeKey);

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

    const hasTitleBar = windowStyle !== 'none';
    const displayTitle = titleText || language;

    const parsedHighlightedLines = useMemo(
      () => parseHighlightedLines(highlightedLines),
      [highlightedLines]
    );

    const outerStyle: React.CSSProperties = {
      position: 'relative',
      background: outerBackground,
      padding: `${padding}px`,
      overflow: 'hidden',
      ...(customWidth > 0 ? { width: `${customWidth}px` } : {}),
      ...(ASPECT_RATIO_MAP[aspectRatio]
        ? { aspectRatio: ASPECT_RATIO_MAP[aspectRatio], minHeight: 0 }
        : {}),
    };

    return (
      <div ref={ref} style={outerStyle} className="rounded-2xl">
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

        {/* Code window */}
        <div
          style={{
            position: 'relative',
            borderRadius: `${borderRadius}px`,
            boxShadow: SHADOW_MAP[shadowSize],
            backgroundColor: themeBg,
            overflow: 'hidden',
          }}
        >
          {hasTitleBar && (
            <div
              className={cn(
                'flex items-center px-4 relative',
                windowStyle === 'windows' ? 'flex-row-reverse py-0' : 'py-2.5'
              )}
              style={{
                backgroundColor: themeBg,
                borderBottom: '1px solid rgba(128,128,128,0.08)',
              }}
            >
              {windowStyle === 'macos' && <MacOSControls />}
              {windowStyle === 'windows' && <WindowsControls />}
              {displayTitle && (
                <span
                  className={cn(
                    'text-xs select-none',
                    windowStyle === 'macos'
                      ? 'absolute left-1/2 -translate-x-1/2'
                      : 'mr-auto py-1.5'
                  )}
                  style={{ color: '#9ca3af', opacity: 0.6, fontSize: '12px' }}
                >
                  {displayTitle}
                </span>
              )}
            </div>
          )}

          <CodeMirrorDisplay
            code={code}
            language={language}
            themeKey={themeKey as ThemeKey}
            showLineNumbers={showLineNumbers}
            enableCodeFolding={false}
            enableWordWrap={true}
            fontSize={`${fontSize}px`}
            fontFamily={fontFamily}
            fontLigatures={fontLigatures}
            lineHeightValue={lineHeight}
            letterSpacing={letterSpacing}
            highlightedLines={parsedHighlightedLines}
            highlightColor={highlightColor}
            dimUnhighlighted={dimUnhighlighted}
            dimOpacity={dimOpacity}
          />
        </div>

        {/* Watermark */}
        {watermarkText && (
          <div
            style={{
              position: 'absolute',
              ...WATERMARK_POSITION_STYLES[watermarkPosition],
              opacity: watermarkOpacity / 100,
              fontSize: '11px',
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
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

CodeImagePreview.displayName = 'CodeImagePreview';

export default CodeImagePreview;
