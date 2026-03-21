import type { LucideIcon } from 'lucide-react';
import { Bookmark, Clock, FileText, Gauge, Layers, LetterText } from 'lucide-react';
import React, { memo, useMemo } from 'react';

import { useActiveTab } from '@/components/features/tabs';
import { estimateReadingTime } from '@/services/section/parsing';

const Item: React.FC<{ icon: LucideIcon; children: React.ReactNode; className?: string }> = ({
  icon: Icon,
  children,
  className = '',
}) => (
  <span className={`flex items-center gap-1 ${className}`}>
    <Icon className="size-3 opacity-60" />
    {children}
  </span>
);

const Sep: React.FC = () => <span className="text-muted-foreground/30">|</span>;

function formatReadingTime(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return '< 1 min';
  return `${minutes} min`;
}

function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return `${count}`;
}

const StatusBar: React.FC = memo(() => {
  const activeTab = useActiveTab();

  const stats = useMemo(() => {
    if (!activeTab?.readingState.isInitialized) return null;

    const { sections, readSections, currentIndex, readingMode, scrollProgress } =
      activeTab.readingState;

    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
    const totalTimeMs = estimateReadingTime(totalWords);
    const totalSections = sections.length;
    const readCount = readSections.size;
    const currentSection = sections[currentIndex];

    const progressPercent =
      readingMode === 'scroll'
        ? Math.round(scrollProgress * 100)
        : totalSections > 0
          ? Math.round((readCount / totalSections) * 100)
          : 0;

    return {
      title: activeTab.title,
      sourceType: activeTab.sourceType,
      currentIndex,
      totalSections,
      readCount,
      totalWords,
      totalTime: formatReadingTime(totalTimeMs),
      progressPercent,
      currentSectionTitle: currentSection?.title,
      readingMode,
    };
  }, [activeTab]);

  if (!stats) return null;

  return (
    <div className="shrink-0 flex items-center justify-between h-6 px-3 border-t border-border/40 bg-muted/20 text-[11px] text-muted-foreground font-cascadia-code select-none">
      {/* Left: file info */}
      <div className="flex items-center gap-3 min-w-0">
        <Item icon={FileText} className="truncate max-w-48">
          {stats.title}
        </Item>
        <span className="text-muted-foreground/40 uppercase text-[10px]">{stats.sourceType}</span>
      </div>

      {/* Center: reading position */}
      <div className="flex items-center gap-3">
        <Item icon={Bookmark} className="tabular-nums">
          {stats.currentIndex + 1}/{stats.totalSections}
        </Item>
        <Sep />
        <Item icon={Gauge} className="tabular-nums">
          {stats.progressPercent}%
        </Item>
      </div>

      {/* Right: document stats */}
      <div className="flex items-center gap-3">
        <Item icon={LetterText} className="tabular-nums">
          {formatWordCount(stats.totalWords)} words
        </Item>
        <Sep />
        <Item icon={Clock}>{stats.totalTime} read</Item>
        <Sep />
        <Item icon={Layers} className="capitalize">
          {stats.readingMode}
        </Item>
      </div>
    </div>
  );
});

StatusBar.displayName = 'StatusBar';

export default StatusBar;
