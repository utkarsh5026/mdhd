import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTabsStore } from '@/components/features/tabs/store/tabs-store';
import { progressTracker } from '@/services/progress';

import { useReadingTabId } from './use-reading-selectors';

/**
 * Wires the active tab's reading position into the progress tracker.
 *
 * No-ops for paste tabs (no `sourceFileId`) and for unauthenticated sessions.
 * On unmount or tab change, blurs the tracker so seconds stop accruing against
 * a tab that's no longer active.
 */
export function useProgressTracker(): void {
  const tabId = useReadingTabId();
  const { fileId, sourceType, currentIndex, scrollProgress, sectionCount } = useTabsStore(
    useShallow((s) => {
      const tab = s.tabs.find((t) => t.id === tabId);
      return {
        fileId: tab?.sourceFileId,
        sourceType: tab?.sourceType,
        currentIndex: tab?.readingState.currentIndex ?? 0,
        scrollProgress: tab?.readingState.scrollProgress ?? 0,
        sectionCount: tab?.readingState.sections.length ?? 0,
      };
    })
  );

  useEffect(() => {
    progressTracker.start();
  }, []);

  useEffect(() => {
    if (sourceType !== 'file' || !fileId) return;
    progressTracker.track(fileId, currentIndex, Math.max(0, Math.min(1, scrollProgress)));
    if (sectionCount > 0 && currentIndex >= sectionCount - 1 && scrollProgress >= 0.95) {
      progressTracker.markCompleted(fileId);
    }
    return () => {
      if (fileId) progressTracker.blur(fileId);
    };
  }, [fileId, sourceType, currentIndex, scrollProgress, sectionCount]);
}
