import React, { useState, useEffect, useCallback, memo } from 'react';
import { Maximize2, Settings, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import SectionsSheet from '@/components/features/content-reading/components/table-of-contents/sections-sheet';
import ReadingSettingsSheet from '@/components/features/settings/components/reading-settings-selector';
import FloatingThemePicker from '@/components/shared/theme/components/floating-theme-picker';
import { useThemeStore } from '@/components/shared/theme/store/theme-store';
import {
  NavigationControls,
  DesktopProgressIndicator,
  LoadingState,
  ContentReader,
  ScrollContentReader,
} from '@/components/features/content-reading/components/layout';
import { useControls } from '@/components/features/content-reading/hooks';
import { useTabNavigation } from '../hooks/use-tab-navigation';
import { useTabsStore } from '../store/tabs-store';
import MarkdownCodeMirrorEditor from './markdown-codemirror-editor';

interface InlineMarkdownViewerProps {
  tabId: string;
  viewMode: 'preview' | 'edit';
  onContentChange: (content: string) => void;
  onEnterFullscreen: () => void;
}

interface InlineHeaderProps {
  onFullscreen: () => void;
  onSettings: () => void;
  onMenu: () => void;
  isVisible: boolean;
}

const InlineHeader: React.FC<InlineHeaderProps> = memo(
  ({ onFullscreen, onSettings, onMenu, isVisible }) => {
    if (!isVisible) return null;

    return (
      <div
        className={cn(
          'relative w-full z-50',
          'animate-in fade-in slide-in-from-top-4 duration-500'
        )}
      >
        <div className="relative flex items-center justify-between p-3 sm:p-4">
          {/* Left: Fullscreen button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onFullscreen}
                className={cn(
                  'relative group touch-manipulation',
                  'p-2.5 sm:p-3 rounded-full',
                  'transition-all duration-300 ease-out',
                  'border-2 backdrop-blur-md shadow-lg',
                  'bg-cardBg/80 border-border/50 text-foreground',
                  'hover:border-primary/50 hover:bg-cardBg/90',
                  'hover:shadow-xl hover:scale-105',
                  'hover:text-primary',
                  'active:scale-95'
                )}
              >
                <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:scale-110" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="font-cascadia-code text-xs rounded-2xl backdrop-blur-2xl bg-background/20 text-primary"
            >
              Fullscreen
            </TooltipContent>
          </Tooltip>

          {/* Right: Settings and Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onSettings}
                  className={cn(
                    'relative group touch-manipulation',
                    'p-2.5 sm:p-3 rounded-full',
                    'transition-all duration-300 ease-out',
                    'border-2 backdrop-blur-md shadow-lg',
                    'bg-cardBg/80 border-border/50 text-foreground',
                    'hover:border-border hover:bg-cardBg/90',
                    'hover:shadow-xl hover:scale-105',
                    'hover:text-primary',
                    'active:scale-95'
                  )}
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:scale-110" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="font-cascadia-code text-xs rounded-2xl backdrop-blur-2xl bg-background/20 text-primary"
              >
                Reading Settings
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-5 sm:h-6 bg-linear-to-b from-transparent via-border to-transparent" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onMenu}
                  className={cn(
                    'relative group touch-manipulation',
                    'p-2.5 sm:p-3 rounded-full',
                    'transition-all duration-300 ease-out',
                    'border-2 backdrop-blur-md shadow-lg',
                    'bg-cardBg/80 border-border/50 text-foreground',
                    'hover:border-border hover:bg-cardBg/90',
                    'hover:shadow-xl hover:scale-105',
                    'hover:text-primary',
                    'active:scale-95'
                  )}
                >
                  <List className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:scale-110" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="font-cascadia-code text-xs rounded-2xl backdrop-blur-2xl bg-background/20 text-primary"
              >
                Table of Contents
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
);

InlineHeader.displayName = 'InlineHeader';

const InlineMarkdownViewer: React.FC<InlineMarkdownViewerProps> = memo(
  ({ tabId, viewMode, onContentChange, onEnterFullscreen }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const pendingFloatingPickerOpen = useThemeStore((state) => state.pendingFloatingPickerOpen);
    const openFloatingPicker = useThemeStore((state) => state.openFloatingPicker);

    const tab = useTabsStore((state) => state.tabs.find((t) => t.id === tabId));

    const {
      sections,
      readSections,
      currentIndex,
      readingMode,
      scrollProgress,
      isTransitioning,
      goToNext,
      goToPrevious,
      changeSection,
      markSectionAsRead,
      getSection,
      handleScrollProgress,
    } = useTabNavigation(tabId);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    const { isControlsVisible, handleInteraction, handleDoubleClick } = useControls({
      goToNext,
      goToPrevious,
      readingMode,
    });

    // Scroll to top when changing sections (card mode)
    useEffect(() => {
      if (readingMode === 'card' && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, [currentIndex, readingMode]);

    // Open floating theme picker after settings sheet closes
    useEffect(() => {
      if (!settingsOpen && pendingFloatingPickerOpen) {
        const timer = setTimeout(() => {
          openFloatingPicker();
        }, 350);
        return () => clearTimeout(timer);
      }
    }, [settingsOpen, pendingFloatingPickerOpen, openFloatingPicker]);

    // Jump to specific section
    const handleSelectCard = useCallback(
      (index: number) => {
        if (readingMode === 'scroll') {
          const sectionElement = document.getElementById(`section-${sections[index]?.id}`);
          if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
          markSectionAsRead(index);
        } else {
          if (index !== currentIndex) changeSection(index);
        }
      },
      [readingMode, sections, currentIndex, changeSection, markSectionAsRead]
    );

    // Handle section visibility
    const handleSectionVisible = useCallback(
      (index: number) => {
        markSectionAsRead(index);
      },
      [markSectionAsRead]
    );

    const currentSection = getSection(currentIndex);

    if (!tab || sections.length === 0 || !currentSection) {
      return <LoadingState />;
    }

    return (
      <div className="h-full relative bg-background text-foreground">
        {/* Content Container */}
        <AnimatePresence mode="wait">
          {viewMode === 'edit' ? (
            <motion.div
              key="edit-mode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <MarkdownCodeMirrorEditor
                content={tab.content}
                onChange={onContentChange}
              />
            </motion.div>
          ) : readingMode === 'card' ? (
            <motion.div
              key="preview-card-mode"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <ContentReader
                markdown={tab.content}
                goToNext={goToNext}
                goToPrevious={goToPrevious}
                isTransitioning={isTransitioning}
                scrollRef={scrollRef}
                handleDoubleClick={handleDoubleClick}
                currentSection={currentSection}
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview-scroll-mode"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <ScrollContentReader
                sections={sections}
                scrollRef={scrollRef}
                handleDoubleClick={handleDoubleClick}
                onScrollProgress={handleScrollProgress}
                onSectionVisible={handleSectionVisible}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header - only show in preview mode */}
        {viewMode === 'preview' && (
          <AnimatePresence>
            <div className="absolute top-0 left-0 right-0 z-50">
              <InlineHeader
                onFullscreen={onEnterFullscreen}
                onSettings={() => {
                  setSettingsOpen(true);
                  handleInteraction();
                }}
                onMenu={() => {
                  setMenuOpen(true);
                  handleInteraction();
                }}
                isVisible={isControlsVisible}
              />
            </div>
          </AnimatePresence>
        )}

        {/* Navigation Controls (card mode only, preview mode only) */}
        {viewMode === 'preview' && (
          <AnimatePresence>
            {readingMode === 'card' && (
              <div className="absolute bottom-0 left-0 right-0 z-50">
                <NavigationControls
                  currentIndex={currentIndex}
                  total={sections.length}
                  onPrevious={() => {
                    goToPrevious();
                    handleInteraction();
                  }}
                  onNext={() => {
                    goToNext();
                    handleInteraction();
                  }}
                  isVisible={isControlsVisible}
                />
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Desktop side progress - only in preview mode */}
        {viewMode === 'preview' && (
          <DesktopProgressIndicator
            currentIndex={currentIndex}
            total={sections.length}
            onSelectSection={(index) => handleSelectCard(index)}
            sections={sections}
            readSections={readSections}
            readingMode={readingMode}
            scrollProgress={scrollProgress}
          />
        )}

        {/* Sections Sheet */}
        <SectionsSheet
          currentIndex={currentIndex}
          handleSelectCard={handleSelectCard}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          sections={sections}
          readSections={readSections}
        />

        {/* Reading Settings Sheet */}
        <ReadingSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

        {/* Floating Theme Picker */}
        <FloatingThemePicker />
      </div>
    );
  }
);

InlineMarkdownViewer.displayName = 'InlineMarkdownViewer';

export default InlineMarkdownViewer;
