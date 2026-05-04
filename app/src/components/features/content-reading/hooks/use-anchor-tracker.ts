import { type RefObject, useEffect } from 'react';

import { useTabSlice } from '@/components/features/tabs/store/hooks';
import { anchorForBlock, listBlocks, progressTracker } from '@/services/progress';

import { useReadingTabId } from './use-reading-selectors';

const RECOMPUTE_INTERVAL_MS = 1500;

/**
 * Pushes the topmost-visible block in scroll mode to the progress tracker so
 * cross-device resume can land on the exact paragraph instead of falling back
 * to scroll-percent.
 *
 * No-ops for unsaved tabs and unauthenticated sessions. Recomputes on a slow
 * interval rather than on every scroll event — anchor changes happen at the
 * speed of human reading, not the speed of the scroll wheel.
 */
export function useAnchorTracker(scrollRef: RefObject<HTMLDivElement | null>): void {
  const tabId = useReadingTabId();
  const fileId = useTabSlice(tabId, (tab) => tab?.sourceFileId);

  useEffect(() => {
    if (!fileId) return;
    const root = scrollRef.current;
    if (!root) return;

    let cancelled = false;

    const compute = () => {
      if (cancelled) return;
      const block = topmostVisibleBlock(root);
      if (!block) return;

      const sectionEl = block.closest('[data-section-index]');
      if (!sectionEl) return;

      const anchor = anchorForBlock(block, sectionEl);
      if (!anchor) return;
      progressTracker.setAnchor(fileId, anchor);
    };

    const initial = requestAnimationFrame(() => compute());
    const timer = setInterval(compute, RECOMPUTE_INTERVAL_MS);

    return () => {
      cancelled = true;
      cancelAnimationFrame(initial);
      clearInterval(timer);
    };
  }, [fileId, scrollRef]);
}

/**
 * Find the topmost block visible inside `root` — i.e., the block whose top edge
 * is closest to (but not above) the root's top. Walks every section's blocks
 * via {@link listBlocks} so heading-path computation is consistent with what
 * the resume cascade will see.
 */
function topmostVisibleBlock(root: HTMLElement): Element | null {
  const rootTop = root.getBoundingClientRect().top;
  const sections = root.querySelectorAll('[data-section-index]');
  let bestEl: Element | null = null;
  let bestDeltaAbs = Number.POSITIVE_INFINITY;

  for (const section of Array.from(sections)) {
    listBlocks(section).forEach((block) => {
      const rect = block.getBoundingClientRect();
      if (rect.bottom <= rootTop) return;
      const delta = rect.top - rootTop;
      if (delta < -rect.height) return;
      const deltaAbs = Math.abs(delta);
      if (deltaAbs < bestDeltaAbs) {
        bestEl = block;
        bestDeltaAbs = deltaAbs;
      }
    });
  }
  return bestEl;
}
