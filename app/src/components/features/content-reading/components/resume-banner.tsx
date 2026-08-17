import { memo, useEffect, useState } from 'react';

import { useTabSlice } from '@/components/features/tabs/store/hooks';
import { Button } from '@/components/ui/button';
import { useIsAuthenticated } from '@/services/auth';
import { useIsOnline } from '@/services/offline';
import { fetchProgressForFile, findBlockByAnchor, type ServerProgress } from '@/services/progress';

import { useReadingActions, useReadingTabId } from '../hooks/use-reading-selectors';

const DISMISS_KEY_PREFIX = 'mdhd-resume-dismissed-';

/**
 * Banner that surfaces the user's last cross-device reading position when it
 * differs from the locally-restored one. One-shot per tab session — once
 * dismissed (via "Dismiss" or "Resume"), it stays hidden until the tab is
 * reopened.
 *
 * Resume behaviour:
 *  - Card mode: change to the saved section.
 *  - Scroll mode: change section, then resolve the saved anchor against the
 *    rendered DOM and scroll the matched block into view. Resolution falls
 *    through several tiers (see `findBlockByAnchor`) so a small content edit
 *    doesn't cliff-fall back to "scroll to 40%".
 */
const ResumeBanner = memo(() => {
  const tabId = useReadingTabId();
  const { fileId, currentIndex, sections, readingMode } = useTabSlice(tabId, (tab) => {
    const rs = tab?.readingState;
    return {
      fileId: tab?.sourceFileId,
      currentIndex: rs?.currentIndex ?? 0,
      sections: rs?.sections ?? [],
      readingMode: (rs?.readingMode ?? 'card') as 'card' | 'scroll',
    };
  });
  const { changeSection } = useReadingActions();
  const isAuthenticated = useIsAuthenticated();
  const isOnline = useIsOnline();

  const [progress, setProgress] = useState<ServerProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setProgress(null);
    setDismissed(false);
    if (!fileId) return;
    // The banner exists to surface a position saved on *another* device, so it
    // has nothing to offer signed-out or offline readers — the local position
    // has already been restored from the tab store by this point.
    if (!isAuthenticated || !isOnline) return;
    if (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(DISMISS_KEY_PREFIX + fileId)
    ) {
      setDismissed(true);
      return;
    }
    let cancelled = false;
    void fetchProgressForFile(fileId)
      .then((p) => {
        if (cancelled || !p) return;
        const sectionAhead =
          p.section_index > currentIndex && p.section_index < (sections.length || Infinity);
        const anchorWorthShowing =
          p.section_index === currentIndex && p.anchor_block_offset !== null && p.scroll_pct > 0.05;
        if (sectionAhead || anchorWorthShowing) setProgress(p);
      })
      .catch(() => {
        // A missing cross-device position is not worth a message — the reader
        // keeps the local one either way.
      });
    return () => {
      cancelled = true;
    };
    // currentIndex/sections intentionally not in deps — we only check on tab change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, isAuthenticated, isOnline]);

  const dismiss = () => {
    if (fileId && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(DISMISS_KEY_PREFIX + fileId, '1');
    }
    setDismissed(true);
  };

  const resume = () => {
    if (!progress) return;
    const target = progress.section_index;
    if (target !== currentIndex) changeSection(target);

    if (readingMode === 'scroll' && progress.anchor_block_offset !== null) {
      // Wait for the section change + render to settle before scrolling. Two
      // animation frames is enough in practice; the section's blocks must be
      // in the DOM before the anchor cascade can match.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToAnchor(target, progress));
      });
    }
    dismiss();
  };

  if (dismissed || !progress) return null;
  const targetSection = sections[progress.section_index];
  const path = progress.anchor_heading_path ?? [];
  const breadcrumb = path.length > 0 ? ` → ${path.join(' › ')}` : '';

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-border bg-background/95 px-4 py-2 shadow-md backdrop-blur">
      <span className="text-sm">
        Continue at section {progress.section_index + 1}
        {targetSection?.title ? `: ${targetSection.title}` : ''}
        {breadcrumb}?
      </span>
      <Button size="sm" onClick={resume}>
        Resume
      </Button>
      <Button size="sm" variant="ghost" onClick={dismiss}>
        Dismiss
      </Button>
    </div>
  );
});
ResumeBanner.displayName = 'ResumeBanner';

function scrollToAnchor(sectionIndex: number, p: ServerProgress): void {
  const sectionEl = document.querySelector(`[data-section-index="${sectionIndex}"]`);
  if (!sectionEl) return;

  const block = findBlockByAnchor(
    {
      heading_path: p.anchor_heading_path ?? [],
      block_offset: p.anchor_block_offset ?? 0,
      block_tag: p.anchor_block_tag ?? '',
      content_hash: p.anchor_block_hash,
    },
    sectionEl
  );

  if (block) {
    block.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default ResumeBanner;
