import React, { forwardRef, useMemo } from 'react';

import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import type { ThemeKey } from '@/components/features/settings/store/code-theme';
import { getThemeBackground } from '@/components/features/settings/store/codemirror-themes';

import {
  type CodeImageExportSettings,
  parseHighlightedLines,
} from '../store/code-image-export-store';
import {
  DOCK_HEIGHT,
  MacOSDock,
  MacOSMenuBar,
  MacOSTitleBar,
  MENU_BAR_HEIGHT,
  TASKBAR_HEIGHT,
  WindowFrame,
  WindowsTaskbar,
  WindowsTitleBar,
} from './os-window-chrome';
import { buildPatternBackground } from './pattern-backgrounds';

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
      backgroundPatternEnabled,
      backgroundPattern,
      backgroundPatternColor,
      backgroundPatternOpacity,
      backgroundPatternScale,
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
      watermarkColor,
      watermarkSize,
      watermarkFontFamily,
      titlePosition,
      showTitleIcon,
      windowFocused,
      titleBarFrosted,
      windowAccentColor,
      showMenuBar,
      showDock,
      showTaskbar,
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

    const displayTitle = titleText || language;

    const parsedHighlightedLines = useMemo(
      () => parseHighlightedLines(highlightedLines),
      [highlightedLines]
    );

    const menuBarExtra = showMenuBar && windowStyle === 'macos' ? MENU_BAR_HEIGHT : 0;
    const dockExtra = showDock && windowStyle === 'macos' ? DOCK_HEIGHT : 0;
    const taskbarExtra = showTaskbar && windowStyle === 'windows' ? TASKBAR_HEIGHT : 0;
    const bottomExtra = Math.max(dockExtra, taskbarExtra);

    const outerStyle: React.CSSProperties = {
      background: outerBackground,
      paddingTop: padding + menuBarExtra,
      paddingBottom: padding + bottomExtra,
      paddingLeft: padding,
      paddingRight: padding,
      ...(customWidth > 0 ? { width: `${customWidth}px` } : { minWidth: '480px' }),
      ...(ASPECT_RATIO_MAP[aspectRatio]
        ? { aspectRatio: ASPECT_RATIO_MAP[aspectRatio], minHeight: 0 }
        : {}),
    };

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

        {/* Desktop chrome */}
        {showMenuBar && windowStyle === 'macos' && <MacOSMenuBar />}
        {showDock && windowStyle === 'macos' && <MacOSDock />}
        {showTaskbar && windowStyle === 'windows' && <WindowsTaskbar />}

        {/* Code window */}
        <WindowFrame
          windowStyle={windowStyle}
          borderRadius={borderRadius}
          shadowSize={shadowSize}
          themeBg={themeBg}
        >
          {/* OS-specific title bar */}
          {windowStyle === 'macos' && (
            <MacOSTitleBar
              focused={windowFocused}
              frosted={titleBarFrosted}
              title={displayTitle}
              titlePosition={titlePosition}
              showIcon={showTitleIcon}
              language={language}
              themeBg={themeBg}
            />
          )}

          {windowStyle === 'windows' && (
            <WindowsTitleBar
              focused={windowFocused}
              accentColor={windowAccentColor}
              title={displayTitle}
              titlePosition={titlePosition}
              showIcon={showTitleIcon}
              language={language}
              themeBg={themeBg}
            />
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
        </WindowFrame>

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

CodeImagePreview.displayName = 'CodeImagePreview';

export default CodeImagePreview;
