import { Clock } from 'lucide-react';
import { memo } from 'react';

import type { MarkdownSection } from '@/services/section/parsing';

interface SectionReadingTimeProps {
  section: MarkdownSection;
}

const WORDS_PER_MINUTE = 250;

const SectionReadingTime: React.FC<SectionReadingTimeProps> = memo(({ section }) => {
  const minutes = Math.ceil(section.wordCount / WORDS_PER_MINUTE);

  if (section.wordCount < 10) return null;

  const label = minutes <= 1 ? '< 1 min' : `~${minutes} min`;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mb-4 select-none">
      <Clock className="h-3 w-3" />
      <span>{label}</span>
      <span className="text-muted-foreground/30">·</span>
      <span>{section.wordCount.toLocaleString()} words</span>
    </div>
  );
});

SectionReadingTime.displayName = 'SectionReadingTime';
export default SectionReadingTime;
