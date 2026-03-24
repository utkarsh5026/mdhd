import React, { memo, useCallback, useEffect } from 'react';

import { Header, LoadingState } from '@/components/features/content-reading/components/layout';
import ReadingCore from '@/components/features/content-reading/components/reading-core';
import { ReadingTabProvider } from '@/components/features/content-reading/context/reading-tab-context';
import {
  useReadingNavigation,
  useReadingSections,
} from '@/components/features/content-reading/hooks';
import { useReadingZen } from '@/components/features/content-reading/hooks/use-reading-selectors';
import {
  PresentationMode,
  usePresentationActions,
  usePresentationActive,
} from '@/components/features/presentation';

import { useTabsStore } from '../../store/tabs-store';

interface FullscreenMarkdownViewerProps {
  tabId: string;
  onExit: () => void;
}

/**
 * Inner component that lives inside ReadingTabProvider and can use the selector hooks.
 */
const FullscreenInner: React.FC<{ onExit: () => void }> = memo(({ onExit }) => {
  const sections = useReadingSections();
  const { currentIndex } = useReadingNavigation();
  const { isZenMode } = useReadingZen();

  const updateTabReadingState = useTabsStore((s) => s.updateTabReadingState);
  const tabId = useTabsStore((s) => s.activeTabId)!;

  const isPresentationActive = usePresentationActive();
  const { startPresentation } = usePresentationActions();

  const handleStartPresentation = useCallback(() => {
    startPresentation();
  }, [startPresentation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZenMode) {
          updateTabReadingState(tabId, { isZenMode: false, zenControlsVisible: false });
        } else {
          onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, onExit, tabId, updateTabReadingState]);

  useEffect(() => {
    window.history.pushState({ fullscreen: true }, '');

    const handlePopState = () => {
      onExit();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onExit]);

  if (sections.length === 0) {
    return <LoadingState />;
  }

  return (
    <>
      <ReadingCore
        viewMode="preview"
        onPresent={handleStartPresentation}
        headerSlot={({
          onSettings,
          onSearch,
          onPresent,
          onPdfExport,
          onToc,
          isVisible,
          breadcrumb,
          mobileBreadcrumb,
        }) => (
          <Header
            onExit={onExit}
            onSettings={onSettings}
            onSearch={onSearch}
            onPresent={onPresent}
            onPdfExport={onPdfExport}
            onToc={onToc}
            isVisible={isVisible}
            breadcrumb={breadcrumb}
            mobileBreadcrumb={mobileBreadcrumb}
          />
        )}
      />

      {isPresentationActive && (
        <PresentationMode sections={sections} initialSlide={currentIndex} onExit={onExit} />
      )}
    </>
  );
});

FullscreenInner.displayName = 'FullscreenInner';

const FullscreenMarkdownViewer: React.FC<FullscreenMarkdownViewerProps> = memo(
  ({ tabId, onExit }) => {
    return (
      <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
        <ReadingTabProvider value={tabId}>
          <FullscreenInner onExit={onExit} />
        </ReadingTabProvider>
      </div>
    );
  }
);

FullscreenMarkdownViewer.displayName = 'FullscreenMarkdownViewer';

export default FullscreenMarkdownViewer;
