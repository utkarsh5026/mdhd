import { ChevronLeft, ChevronRight, FileText, Maximize, Pencil } from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingState } from '@/components/features/content-reading/components/layout';
import ReadingCore from '@/components/features/content-reading/components/reading-core';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { cn } from '@/lib/utils';

import { useEditorPreviewSync } from '../../hooks/use-editor-preview-sync';
import { useTabNavigation } from '../../hooks/use-tab-navigation';
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

interface InlineHeaderProps {
  onFullscreen: () => void;
  onPdfExport: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onEditSection?: () => void;
  currentIndex: number;
  total: number;
  readingMode: 'card' | 'scroll';
  breadcrumb?: React.ReactNode;
  mobileBreadcrumb?: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const InlineHeader: React.FC<InlineHeaderProps> = memo(
  ({
    onFullscreen,
    onPdfExport,
    onPrevious,
    onNext,
    onEditSection,
    currentIndex,
    total,
    readingMode,
    breadcrumb,
    mobileBreadcrumb,
    scrollRef,
  }) => {
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
                <HeaderBtn
                  tooltip="Previous Section"
                  icon={ChevronLeft}
                  onClick={onPrevious}
                  disabled={currentIndex === 0}
                />
                <HeaderBtn
                  tooltip="Next Section"
                  icon={ChevronRight}
                  onClick={onNext}
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
      updateCurrentIndex,
      getSection,
      handleScrollProgress,
      metadata,
    } = useTabNavigation(tabId);

    const currentSection = getSection(currentIndex);

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
          updateCurrentIndex={updateCurrentIndex}
          onScrollProgressChange={handleScrollProgress}
          sourcePath={tab.sourcePath}
          viewMode="preview"
          onSectionClick={handlePreviewSectionClick}
          headerSlot={({ onPdfExport, breadcrumb, mobileBreadcrumb, scrollRef }) => (
            <InlineHeader
              onFullscreen={onEnterFullscreen}
              onPdfExport={onPdfExport}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onEditSection={() => setEditingSectionIndex(currentIndex)}
              currentIndex={currentIndex}
              total={sections.length}
              readingMode={readingMode}
              breadcrumb={breadcrumb}
              mobileBreadcrumb={mobileBreadcrumb}
              scrollRef={scrollRef}
            />
          )}
        />
      );
    }, [
      tab,
      sections,
      currentSection,
      metadata,
      readSections,
      currentIndex,
      isTransitioning,
      readingMode,
      scrollProgress,
      goToNext,
      goToPrevious,
      changeSection,
      markSectionAsRead,
      updateCurrentIndex,
      handleScrollProgress,
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
  }
);

InlineMarkdownViewer.displayName = 'InlineMarkdownViewer';

export default InlineMarkdownViewer;
