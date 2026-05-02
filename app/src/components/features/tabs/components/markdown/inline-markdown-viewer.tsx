import React, { memo, useCallback, useMemo, useState } from 'react';

import { LoadingState } from '@/components/features/content-reading/components/layout';
import ReadingCore from '@/components/features/content-reading/components/reading-core';
import { ReadingTabProvider } from '@/components/features/content-reading/context/reading-tab-context';
import {
  useReadingCurrentSection,
  useReadingSections,
} from '@/components/features/content-reading/hooks';

import { useTabsStore } from '../../store/tabs-store';
import InlineHeader from './inline-header';
import styles from './inline-markdown-viewer.module.css';
import ShareModal from './share-modal';

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

  const [shareOpen, setShareOpen] = useState(false);

  const handleShare = useCallback(() => {
    if (!tab) return;
    setShareOpen(true);
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

  return (
    <>
      <div className={`h-full ${styles.previewMode}`}>{PreviewPanel}</div>
      <ShareModal tab={tab} open={shareOpen} onOpenChange={setShareOpen} />
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
