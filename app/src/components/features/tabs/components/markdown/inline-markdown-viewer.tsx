import React, { memo, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { LoadingState } from '@/components/features/content-reading/components/layout';
import ReadingCore from '@/components/features/content-reading/components/reading-core';
import { ReadingTabProvider } from '@/components/features/content-reading/context/reading-tab-context';
import {
  useReadingCurrentSection,
  useReadingSections,
} from '@/components/features/content-reading/hooks';
import { shareFile } from '@/services/share';

import { useTabsStore } from '../../store/tabs-store';
import InlineHeader from './inline-header';
import styles from './inline-markdown-viewer.module.css';

interface InlineMarkdownViewerProps {
  tabId: string;
  onEnterFullscreen: () => void;
}

/**
 * Inner component that lives inside ReadingTabProvider.
 */
const InlineInner: React.FC<{
  onEnterFullscreen: () => void;
}> = memo(({ onEnterFullscreen }) => {
  const tab = useTabsStore((state) => {
    const activeId = state.activeTabId;
    return state.tabs.find((t) => t.id === activeId);
  });

  const sections = useReadingSections();
  const currentSection = useReadingCurrentSection();

  const handleShare = useCallback(async () => {
    if (!tab) return;
    try {
      const { url } = await shareFile(tab.title, tab.sourcePath ?? tab.title, tab.content);
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied!');
    } catch {
      toast.error('Failed to create share link');
    }
  }, [tab]);

  const PreviewPanel = useMemo(() => {
    if (!tab || sections.length === 0 || !currentSection) {
      return <LoadingState />;
    }

    return (
      <ReadingCore
        viewMode="preview"
        headerSlot={({ onPdfExport, breadcrumb, mobileBreadcrumb, scrollRef }) => (
          <InlineHeader
            onFullscreen={onEnterFullscreen}
            onPdfExport={onPdfExport}
            onShare={handleShare}
            breadcrumb={breadcrumb}
            mobileBreadcrumb={mobileBreadcrumb}
            scrollRef={scrollRef}
          />
        )}
      />
    );
  }, [tab, sections.length, currentSection, onEnterFullscreen, handleShare]);

  if (!tab || sections.length === 0 || !currentSection) {
    return <LoadingState />;
  }

  return <div className={`h-full ${styles.previewMode}`}>{PreviewPanel}</div>;
});

InlineInner.displayName = 'InlineInner';

/**
 * InlineMarkdownViewer - Inline reading mode wrapper
 *
 * Wraps ReadingTabProvider around the inner component so all children
 * can access reading state via selector hooks.
 */
const InlineMarkdownViewer: React.FC<InlineMarkdownViewerProps> = memo(
  ({ tabId, onEnterFullscreen }) => {
    return (
      <ReadingTabProvider value={tabId}>
        <InlineInner onEnterFullscreen={onEnterFullscreen} />
      </ReadingTabProvider>
    );
  }
);

InlineMarkdownViewer.displayName = 'InlineMarkdownViewer';

export default InlineMarkdownViewer;
