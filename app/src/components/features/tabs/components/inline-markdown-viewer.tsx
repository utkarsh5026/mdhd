import React, { memo } from 'react';
import { Settings, List, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReadingCore from '@/components/features/content-reading/components/reading-core';
import { LoadingState } from '@/components/features/content-reading/components/layout';
import { TooltipButton } from '@/components/shared/ui/tooltip-button';
import { useTabNavigation } from '../hooks/use-tab-navigation';
import { useTabsStore } from '../store/tabs-store';
import MarkdownCodeMirrorEditor from './markdown-codemirror-editor';
import styles from './inline-markdown-viewer.module.css';

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
}

const InlineHeader: React.FC<InlineHeaderProps> = memo(
  ({ onFullscreen, onSettings, onMenu }) => {
    return (
      <div className="absolute top-0 right-0 z-50 flex items-center gap-1 p-2">
        <TooltipButton
          tooltipText="Enter Fullscreen"
          button={
            <button
              onClick={onFullscreen}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent/50',
                'transition-colors'
              )}
            >
              <Maximize className="h-4 w-4" />
            </button>
          }
        />
        <TooltipButton
          tooltipText="Reading Settings"
          button={
            <button
              onClick={onSettings}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent/50',
                'transition-colors'
              )}
            >
              <Settings className="h-4 w-4" />
            </button>
          }
        />
        <TooltipButton
          tooltipText="Table of Contents"
          button={
            <button
              onClick={onMenu}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent/50',
                'transition-colors'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          }
        />
      </div>
    );
  }
);

InlineHeader.displayName = 'InlineHeader';

/**
 * 🎯 InlineMarkdownViewer - Inline reading mode wrapper
 *
 * This component wraps ReadingCore and adds:
 * - Fullscreen button header (instead of exit button)
 * - Edit mode support with CodeMirror
 * - Inline-specific controls
 */
const InlineMarkdownViewer: React.FC<InlineMarkdownViewerProps> = memo(
  ({ tabId, viewMode, onContentChange, onEnterFullscreen }) => {
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
      metadata,
    } = useTabNavigation(tabId);

    const currentSection = getSection(currentIndex);

    if (!tab || sections.length === 0 || !currentSection) {
      return <LoadingState />;
    }

    return (
      <>
        {viewMode === 'edit' ? (
          <div key="edit-mode" className={`h-full ${styles.editMode}`}>
            <div className="h-full relative bg-background text-foreground">
              <MarkdownCodeMirrorEditor content={tab.content} onChange={onContentChange} />
            </div>
          </div>
        ) : (
          <div key="preview-mode" className={`h-full ${styles.previewMode}`}>
            <ReadingCore
              markdown={tab.content}
              metadata={metadata}
              sections={sections}
              readSections={readSections}
              currentIndex={currentIndex}
              currentSection={currentSection}
              isTransitioning={isTransitioning}
              readingMode={readingMode}
              scrollProgress={scrollProgress}
              goToNext={goToNext}
              goToPrevious={goToPrevious}
              changeSection={changeSection}
              markSectionAsRead={markSectionAsRead}
              onScrollProgressChange={handleScrollProgress}
              viewMode="preview"
              headerSlot={({ onSettings, onMenu }) => (
                <InlineHeader
                  onFullscreen={onEnterFullscreen}
                  onSettings={onSettings}
                  onMenu={onMenu}
                />
              )}
            />
          </div>
        )}
      </>
    );
  }
);

InlineMarkdownViewer.displayName = 'InlineMarkdownViewer';

export default InlineMarkdownViewer;
