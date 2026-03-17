import { memo, useMemo } from 'react';
import { VscSymbolNamespace, VscSymbolClass, VscSymbolMethod, VscMarkdown } from 'react-icons/vsc';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

interface BreadcrumbItem {
  section: MarkdownSection;
  index: number;
}

interface SectionBreadcrumbProps {
  sections: MarkdownSection[];
  currentIndex: number;
  onNavigate?: (index: number) => void;
}

const LEVEL_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  0: VscMarkdown,
  1: VscSymbolNamespace,
  2: VscSymbolClass,
  3: VscSymbolMethod,
};

const LEVEL_COLORS: Record<number, string> = {
  0: 'text-blue-400',
  1: 'text-purple-400',
  2: 'text-yellow-400',
  3: 'text-green-400',
};

function getAncestors(sections: MarkdownSection[], currentIndex: number): BreadcrumbItem[] {
  const current = sections[currentIndex];
  if (!current) return [];

  const ancestors: BreadcrumbItem[] = [];
  let targetLevel = current.level;

  for (let i = currentIndex - 1; i >= 0 && targetLevel > 1; i--) {
    const section = sections[i];
    if (section.level < targetLevel && section.level > 0) {
      ancestors.unshift({ section, index: i });
      targetLevel = section.level;
    }
  }

  ancestors.push({ section: current, index: currentIndex });
  return ancestors;
}

const SectionBreadcrumb: React.FC<SectionBreadcrumbProps> = memo(
  ({ sections, currentIndex, onNavigate }) => {
    const breadcrumbs = useMemo(
      () => getAncestors(sections, currentIndex),
      [sections, currentIndex]
    );

    if (breadcrumbs.length <= 1 && (sections[currentIndex]?.level ?? 0) <= 1) {
      return null;
    }

    return (
      <nav
        aria-label="Section breadcrumb"
        className={cn(
          'flex items-center gap-0.5 flex-wrap',
          'text-xs text-muted-foreground',
          'rounded-md px-1.5 py-1',
          'bg-background/60 backdrop-blur-sm'
        )}
      >
        {breadcrumbs.map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const Icon = LEVEL_ICONS[item.section.level] ?? VscMarkdown;
          const iconColor = LEVEL_COLORS[item.section.level] ?? 'text-muted-foreground';

          return (
            <span key={item.index} className="flex items-center gap-0.5">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
              <button
                onClick={() => !isLast && onNavigate?.(item.index)}
                className={cn(
                  'flex items-center gap-1 rounded px-1 py-0.5',
                  'transition-colors',
                  isLast
                    ? 'text-foreground/80 font-medium cursor-default'
                    : 'hover:text-foreground hover:bg-accent/50 cursor-pointer'
                )}
                disabled={isLast}
                title={item.section.title}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', iconColor)} />
                <span className="truncate max-w-32">{item.section.title}</span>
              </button>
            </span>
          );
        })}
      </nav>
    );
  }
);

SectionBreadcrumb.displayName = 'SectionBreadcrumb';

export default SectionBreadcrumb;
