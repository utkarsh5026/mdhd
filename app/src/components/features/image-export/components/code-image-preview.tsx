import React, { forwardRef, useCallback, useMemo, useRef } from 'react';

import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import type { ThemeKey } from '@/components/features/settings/store/code-theme';
import { getThemeBackground } from '@/components/features/settings/store/codemirror-themes';

import {
  type CodeImageExportSettings,
  parseHighlightedLines,
} from '../store/code-image-export-store';
import type { Annotation, SharedExportSettings } from '../store/types';
import {
  ASPECT_RATIO_MAP,
  CODE_PREVIEW_MIN_WIDTH,
  sanitizeBackgroundImageUrl,
  WATERMARK_POSITION_STYLES,
} from '../utils/constants';
import { DeviceFrameWrapper } from './device-frames/index';
import {
  DOCK_HEIGHT,
  GNOME_DASH_WIDTH,
  GNOME_TOP_BAR_HEIGHT,
  GnomeDash,
  GnomeTopBar,
  KDE_PANEL_HEIGHT,
  KDEPanel,
  LinuxGnomeTitleBar,
  LinuxKDETitleBar,
  MacOSDock,
  MacOSMenuBar,
  MacOSTitleBar,
  MENU_BAR_HEIGHT,
  RetroTerminalTitleBar,
  TASKBAR_HEIGHT,
  WindowFrame,
  WindowsTaskbar,
  WindowsTitleBar,
} from './os-window-chrome';
import {
  BackgroundImageLayers,
  ContentDragWrapper,
  InteractiveOverlay,
  PatternBackgroundLayer,
  StaticExportOverlay,
} from './overlays';
import { buildPatternBackground } from './pattern-backgrounds';

interface CodeImagePreviewProps {
  code: string;
  language: string;
  settings: CodeImageExportSettings;
  onAnnotationUpdate?: (id: string, partial: Partial<Annotation>) => void;
  onSettingsUpdate?: (partial: Partial<SharedExportSettings>) => void;
}

const CodeImagePreview = forwardRef<HTMLDivElement, CodeImagePreviewProps>(
  ({ code, language, settings, onAnnotationUpdate, onSettingsUpdate }, ref) => {
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
      customHeight,
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
      showGnomeTopBar,
      showGnomeDash,
      showKdePanel,
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

    const themeBg = getThemeBackground(themeKey);

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

    const displayTitle = titleText || language;

    const parsedHighlightedLines = useMemo(
      () => parseHighlightedLines(highlightedLines),
      [highlightedLines]
    );

    const menuBarExtra = showMenuBar && windowStyle === 'macos' ? MENU_BAR_HEIGHT : 0;
    const dockExtra = showDock && windowStyle === 'macos' ? DOCK_HEIGHT : 0;
    const taskbarExtra = showTaskbar && windowStyle === 'windows' ? TASKBAR_HEIGHT : 0;
    const kdePanelExtra = showKdePanel && windowStyle === 'linux-kde' ? KDE_PANEL_HEIGHT : 0;
    const bottomExtra = Math.max(dockExtra, taskbarExtra, kdePanelExtra);
    const gnomeTopBarExtra =
      showGnomeTopBar && windowStyle === 'linux-gnome' ? GNOME_TOP_BAR_HEIGHT : 0;
    const gnomeDashExtra = showGnomeDash && windowStyle === 'linux-gnome' ? GNOME_DASH_WIDTH : 0;

    const outerStyle: React.CSSProperties = {
      background: outerBackground,
      paddingTop: padding + menuBarExtra + gnomeTopBarExtra,
      paddingBottom: padding + bottomExtra,
      paddingLeft: padding + gnomeDashExtra,
      paddingRight: padding,
      ...(customWidth > 0 ? { width: `${customWidth}px` } : { minWidth: CODE_PREVIEW_MIN_WIDTH }),
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

    // Gradient border wrapper style
    const gradientBorderStyle: React.CSSProperties | undefined = gradientBorderEnabled
      ? {
          background: `linear-gradient(${gradientBorderAngle}deg, ${gradientBorderColorStart}, ${gradientBorderColorEnd})`,
          padding: `${gradientBorderWidth}px`,
          borderRadius: `${borderRadius + gradientBorderWidth}px`,
        }
      : undefined;

    const titleBarProps = {
      focused: windowFocused,
      title: displayTitle,
      titlePosition,
      showIcon: showTitleIcon,
      language,
      themeBg,
    };

    const windowContent = (
      <WindowFrame
        windowStyle={windowStyle}
        borderRadius={gradientBorderEnabled ? borderRadius : borderRadius}
        shadowSize={gradientBorderEnabled ? 'none' : shadowSize}
        themeBg={themeBg}
      >
        {/* OS-specific title bar */}
        {windowStyle === 'macos' && <MacOSTitleBar {...titleBarProps} frosted={titleBarFrosted} />}

        {windowStyle === 'windows' && (
          <WindowsTitleBar {...titleBarProps} accentColor={windowAccentColor} />
        )}

        {windowStyle === 'linux-gnome' && <LinuxGnomeTitleBar {...titleBarProps} />}

        {windowStyle === 'linux-kde' && <LinuxKDETitleBar {...titleBarProps} />}

        {windowStyle === 'retro-terminal' && <RetroTerminalTitleBar {...titleBarProps} />}

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
    );

    return (
      <div
        ref={mergedRef}
        style={outerStyle}
        className="relative overflow-hidden flex flex-col items-center justify-center rounded-2xl"
      >
        {/* Image background layers */}
        <BackgroundImageLayers
          isImageBg={!!isImageBg}
          transparentBackground={transparentBackground}
          safeBgImage={safeBgImage ?? ''}
          backgroundImageOpacity={backgroundImageOpacity}
          imageFitStyle={imageFitStyle}
          backgroundImageOverlay={backgroundImageOverlay}
          backgroundImageOverlayOpacity={backgroundImageOverlayOpacity}
        />

        {/* Pattern background overlay */}
        <PatternBackgroundLayer patternBgStyle={patternBgStyle} />

        {/* Desktop chrome */}
        {showMenuBar && windowStyle === 'macos' && <MacOSMenuBar />}
        {showDock && windowStyle === 'macos' && <MacOSDock />}
        {showTaskbar && windowStyle === 'windows' && <WindowsTaskbar />}
        {showGnomeTopBar && windowStyle === 'linux-gnome' && <GnomeTopBar />}
        {showGnomeDash && windowStyle === 'linux-gnome' && <GnomeDash />}
        {showKdePanel && windowStyle === 'linux-kde' && <KDEPanel />}

        {/* Device frame wrapper + gradient border + code window */}
        {interactive ? (
          <ContentDragWrapper
            containerRef={localRef}
            offsetX={settings.contentOffsetX}
            offsetY={settings.contentOffsetY}
            scale={1}
            onUpdate={onSettingsUpdate}
          >
            <DeviceFrameWrapper frame={deviceFrame}>
              {gradientBorderStyle ? (
                <div style={gradientBorderStyle}>{windowContent}</div>
              ) : (
                windowContent
              )}
            </DeviceFrameWrapper>
          </ContentDragWrapper>
        ) : (
          <div
            style={
              settings.contentOffsetX || settings.contentOffsetY
                ? {
                    transform: `translate(${settings.contentOffsetX}px, ${settings.contentOffsetY}px)`,
                  }
                : undefined
            }
          >
            <DeviceFrameWrapper frame={deviceFrame}>
              {gradientBorderStyle ? (
                <div style={gradientBorderStyle}>{windowContent}</div>
              ) : (
                windowContent
              )}
            </DeviceFrameWrapper>
          </div>
        )}

        {/* Annotations + Watermark: interactive or static */}
        {interactive ? (
          <InteractiveOverlay
            containerRef={localRef}
            annotations={annotations}
            settings={settings}
            onAnnotationUpdate={onAnnotationUpdate}
            onSettingsUpdate={onSettingsUpdate}
          />
        ) : (
          <StaticExportOverlay
            annotations={annotations}
            watermarkText={watermarkText}
            watermarkStyle={
              watermarkText
                ? {
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
                  }
                : undefined
            }
          />
        )}
      </div>
    );
  }
);

CodeImagePreview.displayName = 'CodeImagePreview';

export default CodeImagePreview;
