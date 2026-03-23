import { ChevronLeft, ChevronRight, FileText, Maximize, Pencil } from 'lucide-react';
import React, { type FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingState } from '@/components/features/content-reading/components/layout';
import ReadingCore from '@/components/features/content-reading/components/reading-core';
import { ReadingTabProvider } from '@/components/features/content-reading/context/reading-tab-context';
import {
  useReadingActions,
  useReadingCurrentSection,
  useReadingNavigation,
  useReadingProgress,
  useReadingSections,
} from '@/components/features/content-reading/hooks';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { useMilestone } from '@/hooks';
import { cn } from '@/lib/utils';

import { useEditorPreviewSync } from '../../hooks/use-editor-preview-sync';
import { useTabsStore } from '../../store/tabs-store';
import styles from './inline-markdown-viewer.module.css';
import MarkdownCodeMirrorEditor from './markdown-codemirror-editor';
import SectionEditorOverlay from './section-editor-overlay';

interface InlineMarkdownViewerProps {
  tabId: string;
  viewMode: 'preview' | 'edit' | 'dual';
  onContentChange: (content: string) => void;
  onEnterFullscreen: () => void;
}

interface HeaderIconButtonProps {
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

const HeaderBtn: React.FC<HeaderIconButtonProps> = ({ tooltip, icon: Icon, onClick, disabled }) => (
  <TooltipButton
    tooltipText={tooltip}
    button={
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    }
  />
);

const MilestoneEmoji: FC<{ readCount: number; total: number }> = memo(({ readCount, total }) => {
  const { milestone, visible } = useMilestone(readCount, total, {
    showDuration: 1200,
    exitDelay: 200,
  });

  if (!milestone) return null;

  return (
    <span
      className={cn(
        'flex items-center gap-1',
        visible ? styles.milestoneEnter : styles.milestoneExit
      )}
    >
      <span className="text-sm">{milestone.emoji}</span>
      <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
        {milestone.label}
      </span>
    </span>
  );
});
MilestoneEmoji.displayName = 'MilestoneEmoji';

interface InlineHeaderProps {
  onFullscreen: () => void;
  onPdfExport: () => void;
  onEditSection?: () => void;
  breadcrumb?: React.ReactNode;
  mobileBreadcrumb?: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * InlineHeader — reads navigation state from ReadingTabContext hooks.
 */
const InlineHeader: React.FC<InlineHeaderProps> = memo(
  ({ onFullscreen, onPdfExport, onEditSection, breadcrumb, mobileBreadcrumb, scrollRef }) => {
    const { currentIndex, readingMode } = useReadingNavigation();
    const sections = useReadingSections();
    const readSections = useReadingProgress();
    const { goToNext, goToPrevious } = useReadingActions();

    const total = sections.length;
    const readCount = readSections.size;

    const [isHidden, setIsHidden] = useState(false);
    const lastScrollTop = useRef(0);

    useEffect(() => {
      const el = scrollRef?.current;
      if (!el) return;

      const handleScroll = () => {
        const scrollTop = el.scrollTop;
        const delta = scrollTop - lastScrollTop.current;

        if (Math.abs(delta) < 8) return;

        setIsHidden(delta > 0 && scrollTop > 40);
        lastScrollTop.current = scrollTop;
      };

      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }, [scrollRef]);

    return (
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-50 bg-card/60 backdrop-blur-2xl border-b border-border/20 shadow-[0_1px_12px_rgba(0,0,0,0.08)]',
          'transition-transform duration-300 ease-out',
          isHidden && '-translate-y-full'
        )}
      >
        {/* Desktop: breadcrumb + controls */}
        <div className="hidden sm:flex items-center gap-2 px-2 py-1">
          {breadcrumb && readingMode === 'card' && (
            <div className="min-w-0 flex-1 overflow-x-auto">{breadcrumb}</div>
          )}
          {(!breadcrumb || readingMode !== 'card') && <div className="flex-1" />}

          <div className="flex items-center gap-1 shrink-0">
            {readingMode === 'card' && (
              <>
                <div className="flex items-center gap-1.5 mr-1">
                  <div className="w-16 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${total > 0 ? (readCount / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {total > 0 ? Math.round((readCount / total) * 100) : 0}%
                  </span>
                  <MilestoneEmoji readCount={readCount} total={total} />
                </div>
                <div className="w-px h-4 bg-border/40 shrink-0 mx-0.5" aria-hidden />
                <HeaderBtn
                  tooltip="Previous Section"
                  icon={ChevronLeft}
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                />
                <HeaderBtn
                  tooltip="Next Section"
                  icon={ChevronRight}
                  onClick={goToNext}
                  disabled={currentIndex === total - 1}
                />
                <div className="w-px h-4 bg-border/40 shrink-0 mx-0.5" aria-hidden />
              </>
            )}
            {onEditSection && readingMode === 'card' && (
              <>
                <HeaderBtn tooltip="Edit Section" icon={Pencil} onClick={onEditSection} />
                <div className="w-px h-4 bg-border/40 shrink-0 mx-0.5" aria-hidden />
              </>
            )}
            <HeaderBtn tooltip="Export to PDF" icon={FileText} onClick={onPdfExport} />
            <HeaderBtn tooltip="Enter Fullscreen" icon={Maximize} onClick={onFullscreen} />
          </div>
        </div>

        {/* Mobile: breadcrumb only (nav controls are in tab bar) */}
        {breadcrumb && readingMode === 'card' && (
          <div className="sm:hidden px-2 py-1.5">{mobileBreadcrumb ?? breadcrumb}</div>
        )}
      </div>
    );
  }
);

InlineHeader.displayName = 'InlineHeader';

/**
 * Inner component that lives inside ReadingTabProvider.
 */
const InlineInner: React.FC<{
  viewMode: 'preview' | 'edit' | 'dual';
  onContentChange: (content: string) => void;
  onEnterFullscreen: () => void;
}> = memo(({ viewMode, onContentChange, onEnterFullscreen }) => {
  const tab = useTabsStore((state) => {
    const activeId = state.activeTabId;
    return state.tabs.find((t) => t.id === activeId);
  });

  const sections = useReadingSections();
  const { currentIndex, readingMode } = useReadingNavigation();
  const currentSection = useReadingCurrentSection();
  const { changeSection, getSection } = useReadingActions();

  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const editingSection = editingSectionIndex !== null ? getSection(editingSectionIndex) : null;

  const handleSectionEditSave = useCallback(
    (newContent: string) => {
      if (!tab || editingSectionIndex === null) return;
      const section = sections[editingSectionIndex];
      if (!section) return;

      const lines = tab.content.split('\n');
      const newLines = newContent.split('\n');
      lines.splice(section.startLine, section.endLine - section.startLine, ...newLines);
      onContentChange(lines.join('\n'));
      setEditingSectionIndex(null);
    },
    [tab, editingSectionIndex, sections, onContentChange]
  );

  const { editorViewRef, handleCursorActivity, handleEditorScroll, handlePreviewSectionClick } =
    useEditorPreviewSync({
      sections,
      currentIndex,
      readingMode,
      changeSection,
      viewMode,
    });

  const PreviewPanel = useMemo(() => {
    if (!tab || sections.length === 0 || !currentSection) {
      return <LoadingState />;
    }

    return (
      <ReadingCore
        viewMode="preview"
        onSectionClick={handlePreviewSectionClick}
        headerSlot={({ onPdfExport, breadcrumb, mobileBreadcrumb, scrollRef }) => (
          <InlineHeader
            onFullscreen={onEnterFullscreen}
            onPdfExport={onPdfExport}
            onEditSection={() => setEditingSectionIndex(currentIndex)}
            breadcrumb={breadcrumb}
            mobileBreadcrumb={mobileBreadcrumb}
            scrollRef={scrollRef}
          />
        )}
      />
    );
  }, [
    tab,
    sections.length,
    currentSection,
    currentIndex,
    onEnterFullscreen,
    handlePreviewSectionClick,
  ]);

  const EditorPanel = useMemo(() => {
    if (!tab) {
      return <LoadingState />;
    }
    return (
      <MarkdownCodeMirrorEditor
        content={tab.content}
        onChange={onContentChange}
        editorViewRef={editorViewRef}
        onCursorActivity={handleCursorActivity}
        onScrollChange={handleEditorScroll}
      />
    );
  }, [tab, onContentChange, editorViewRef, handleCursorActivity, handleEditorScroll]);

  if (!tab || sections.length === 0 || !currentSection) {
    return <LoadingState />;
  }

  const renderContent = () => {
    if (viewMode === 'edit') {
      return (
        <div key="edit-mode" className={`h-full ${styles.editMode}`}>
          <div className="h-full relative bg-background text-foreground">{EditorPanel}</div>
        </div>
      );
    }

    if (viewMode === 'preview') {
      return (
        <div key="preview-mode" className={`h-full ${styles.previewMode}`}>
          {PreviewPanel}
        </div>
      );
    }

    return (
      <div key="dual-mode" className={`h-full ${styles.dualMode}`}>
        <div className="hidden lg:flex flex-row h-full overflow-hidden">
          <div className="w-1/2 h-full border-r border-border/20 relative bg-background text-foreground">
            {EditorPanel}
          </div>
          <div className="w-1/2 h-full relative">{PreviewPanel}</div>
        </div>

        <div className="lg:hidden h-full">{PreviewPanel}</div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {editingSection && (
        <SectionEditorOverlay
          section={editingSection}
          open={editingSectionIndex !== null}
          onOpenChange={(open) => {
            if (!open) setEditingSectionIndex(null);
          }}
          onSave={handleSectionEditSave}
        />
      )}
    </>
  );
});

InlineInner.displayName = 'InlineInner';

/**
 * InlineMarkdownViewer - Inline reading mode wrapper
 *
 * Wraps ReadingTabProvider around the inner component so all children
 * can access reading state via selector hooks.
 */
const InlineMarkdownViewer: React.FC<InlineMarkdownViewerProps> = memo(
  ({ tabId, viewMode, onContentChange, onEnterFullscreen }) => {
    return (
      <ReadingTabProvider value={tabId}>
        <InlineInner
          viewMode={viewMode}
          onContentChange={onContentChange}
          onEnterFullscreen={onEnterFullscreen}
        />
      </ReadingTabProvider>
    );
  }
);

InlineMarkdownViewer.displayName = 'InlineMarkdownViewer';

export default InlineMarkdownViewer;
