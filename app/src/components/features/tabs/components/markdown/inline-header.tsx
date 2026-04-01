import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { type FC, memo, useEffect, useRef, useState } from 'react';

import {
  useReadingActions,
  useReadingNavigation,
  useReadingProgress,
  useReadingSections,
} from '@/components/features/content-reading/hooks';
import Icon from '@/components/ui/icon';
import { TooltipButton } from '@/components/ui/tooltip-button';
import { useMilestone } from '@/hooks';
import { cn } from '@/lib/utils';

import HeaderActionsMenu from './header-actions-menu';
import styles from './inline-markdown-viewer.module.css';

interface HeaderIconButtonProps {
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

const HeaderBtn: React.FC<HeaderIconButtonProps> = ({
  tooltip,
  icon: LucideIcon,
  onClick,
  disabled,
}) => (
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
        <Icon icon={LucideIcon} size="md" />
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

interface CardNavigationControlsProps {
  readCount: number;
  total: number;
  currentIndex: number;
  goToPrevious: () => void;
  goToNext: () => void;
}

const CardNavigationControls: React.FC<CardNavigationControlsProps> = memo(
  ({ readCount, total, currentIndex, goToPrevious, goToNext }) => (
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
  )
);
CardNavigationControls.displayName = 'CardNavigationControls';

export interface InlineHeaderProps {
  onFullscreen: () => void;
  onPdfExport: () => void;
  onShare: () => void;
  breadcrumb?: React.ReactNode;
  mobileBreadcrumb?: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const InlineHeader: React.FC<InlineHeaderProps> = memo(
  ({ onFullscreen, onPdfExport, onShare, breadcrumb, mobileBreadcrumb, scrollRef }) => {
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
              <CardNavigationControls
                readCount={readCount}
                total={total}
                currentIndex={currentIndex}
                goToPrevious={goToPrevious}
                goToNext={goToNext}
              />
            )}
            <HeaderActionsMenu
              onFullscreen={onFullscreen}
              onPdfExport={onPdfExport}
              onShare={onShare}
            />
          </div>
        </div>

        {/* Mobile: breadcrumb + actions menu */}
        <div className="sm:hidden flex items-center gap-1 px-2 py-1">
          {breadcrumb && readingMode === 'card' ? (
            <div className="flex-1 min-w-0">{mobileBreadcrumb ?? breadcrumb}</div>
          ) : (
            <div className="flex-1" />
          )}
          <HeaderActionsMenu
            onFullscreen={onFullscreen}
            onPdfExport={onPdfExport}
            onShare={onShare}
          />
        </div>
      </div>
    );
  }
);

InlineHeader.displayName = 'InlineHeader';

export default InlineHeader;
