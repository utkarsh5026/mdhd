import React, { memo } from 'react';
import { Settings, List, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReadingCore from '@/components/features/content-reading/components/reading-core';
import { LoadingState } from '@/components/features/content-reading/components/layout';
import { TooltipButton } from '@/components/shared/ui/tooltip-button';
import { useTabNavigation } from '../../hooks/use-tab-navigation';
import { useTabsStore } from '../../store/tabs-store';
import MarkdownCodeMirrorEditor from './markdown-codemirror-editor';
import styles from './inline-markdown-viewer.module.css';

interface InlineMarkdownViewerProps {
  tabId: string;
  viewMode: 'preview' | 'edit' | 'dual';
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

    const readingCoreProps = {
      markdown: tab.content,
      metadata,
      sections,
      readSections,
      currentIndex,
      currentSection,
      isTransitioning,
      readingMode,
      scrollProgress,
      goToNext,
      goToPrevious,
      changeSection,
      markSectionAsRead,
      onScrollProgressChange: handleScrollProgress,
      viewMode: 'preview' as const,
      headerSlot: ({ onSettings, onMenu }: { onSettings: () => void; onMenu: () => void }) => (
        <InlineHeader
          onFullscreen={onEnterFullscreen}
          onSettings={onSettings}
          onMenu={onMenu}
        />
      ),
    };

    const PreviewPanel = () => <ReadingCore {...readingCoreProps} />;

    const EditorPanel = () => (
      <MarkdownCodeMirrorEditor content={tab.content} onChange={onContentChange} />
    );


    const renderContent = () => {
      if (viewMode === 'edit') {
        return (
          <div key="edit-mode" className={`h-full ${styles.editMode}`}>
            <div className="h-full relative bg-background text-foreground">
              <EditorPanel />
            </div>
          </div>
        );
      }

      if (viewMode === 'preview') {
        return (
          <div key="preview-mode" className={`h-full ${styles.previewMode}`}>
            <PreviewPanel />
          </div>
        );
      }

      return (
        <div key="dual-mode" className={`h-full ${styles.dualMode}`}>
          <div className="hidden lg:flex flex-row h-full overflow-hidden">
            <div className="w-1/2 h-full border-r border-border/20 relative bg-background text-foreground">
              <EditorPanel />
            </div>
            <div className="w-1/2 h-full relative">
              <PreviewPanel />
            </div>
          </div>

          <div className="lg:hidden h-full">
            <PreviewPanel />
          </div>
        </div>
      );
    };

    return <>{renderContent()}</>;
  }
);

InlineMarkdownViewer.displayName = 'InlineMarkdownViewer';

export default InlineMarkdownViewer;
