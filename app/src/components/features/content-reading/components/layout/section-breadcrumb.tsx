import { memo, useMemo, useState, useCallback } from 'react';
import { VscSymbolNamespace, VscSymbolClass, VscSymbolMethod, VscMarkdown } from 'react-icons/vsc';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';
import * as Popover from '@radix-ui/react-popover';

interface BreadcrumbItem {
  section: MarkdownSection;
  index: number;
}

interface SiblingItem {
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
  0: 'text-muted-foreground',
  1: 'text-primary',
  2: 'text-primary/75',
  3: 'text-primary/55',
};

/** Walk backwards from currentIndex to build the ancestor chain */
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

/**
 * Get direct children of a section — sections at level + 1 that fall within
 * the scope of the given section (before the next section at the same or
 * higher level).
 *
 * For H1: returns its direct H2 children.
 * For H2: returns its direct H3 children.
 */
function getDirectChildren(sections: MarkdownSection[], parentIndex: number): SiblingItem[] {
  const parent = sections[parentIndex];
  if (!parent) return [];

  const parentLevel = parent.level;
  const childLevel = parentLevel + 1;

  // Find the end of this section's scope: next section at same or higher level
  let scopeEnd = sections.length;
  for (let i = parentIndex + 1; i < sections.length; i++) {
    const s = sections[i];
    if (s.level > 0 && s.level <= parentLevel) {
      scopeEnd = i;
      break;
    }
  }

  // Collect direct children (level === parentLevel + 1) within scope
  const children: SiblingItem[] = [];
  for (let i = parentIndex + 1; i < scopeEnd; i++) {
    if (sections[i].level === childLevel) {
      children.push({ section: sections[i], index: i });
    }
  }

  return children;
}

interface BreadcrumbDropdownProps {
  item: BreadcrumbItem;
  children: SiblingItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BreadcrumbDropdown: React.FC<BreadcrumbDropdownProps> = memo(
  ({ item, children, currentIndex, onNavigate, isOpen, onOpenChange }) => {
    const Icon = LEVEL_ICONS[item.section.level] ?? VscMarkdown;
    const iconColor = LEVEL_COLORS[item.section.level] ?? 'text-muted-foreground';
    const isCurrent = item.index === currentIndex;
    const hasChildren = children.length > 0;

    const handleSelect = useCallback(
      (index: number) => {
        onOpenChange(false);
        onNavigate(index);
      },
      [onNavigate, onOpenChange]
    );

    const childLevel = item.section.level + 1;
    const childLevelLabel = childLevel === 1 ? 'H1' : childLevel === 2 ? 'H2' : `H${childLevel}`;

    return (
      <Popover.Root open={isOpen} onOpenChange={hasChildren ? onOpenChange : undefined}>
        <Popover.Trigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 rounded px-1 py-0.5',
              'transition-colors',
              hasChildren
                ? 'hover:text-foreground hover:bg-accent/50 cursor-pointer'
                : 'cursor-default',
              isCurrent ? 'text-foreground/80 font-medium' : 'text-muted-foreground'
            )}
            title={item.section.title}
            disabled={!hasChildren}
          >
            <Icon className={cn('h-3.5 w-3.5 shrink-0', iconColor)} />
            <span className="truncate max-w-32">{item.section.title}</span>
            {hasChildren && (
              <ChevronRight
                className={cn(
                  'h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform',
                  isOpen && 'rotate-90'
                )}
              />
            )}
          </button>
        </Popover.Trigger>

        {hasChildren && (
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              className={cn(
                'z-200 min-w-52 max-w-72 rounded-2xl border border-border',
                'bg-popover text-popover-foreground shadow-lg font-cascadia-code backdrop-blur-2xl',
                'animate-in fade-in-0 zoom-in-95',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
              )}
            >
              <div className="px-3 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {childLevelLabel} subsections
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1 scrollbar-hide">
                {children.map((child) => {
                  const ChildIcon = LEVEL_ICONS[child.section.level] ?? VscMarkdown;
                  const childColor = LEVEL_COLORS[child.section.level] ?? 'text-muted-foreground';
                  const isActive = child.index === currentIndex;

                  return (
                    <button
                      key={child.index}
                      onClick={() => handleSelect(child.index)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left',
                        'transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-accent/50'
                      )}
                    >
                      <ChildIcon className={cn('h-3.5 w-3.5 shrink-0', childColor)} />
                      <span className="flex-1 truncate">{child.section.title}</span>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </Popover.Root>
    );
  }
);

BreadcrumbDropdown.displayName = 'BreadcrumbDropdown';

const SectionBreadcrumb: React.FC<SectionBreadcrumbProps> = memo(
  ({ sections, currentIndex, onNavigate }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const breadcrumbs = useMemo(
      () => getAncestors(sections, currentIndex),
      [sections, currentIndex]
    );

    const siblingsMap = useMemo(
      () =>
        new Map(breadcrumbs.map((item) => [item.index, getDirectChildren(sections, item.index)])),
      [breadcrumbs, sections]
    );

    const handleNavigate = useCallback(
      (index: number) => {
        onNavigate?.(index);
      },
      [onNavigate]
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
        {breadcrumbs.map((item, idx) => (
          <span key={item.index} className="flex items-center gap-0.5">
            {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
            <BreadcrumbDropdown
              item={item}
              children={siblingsMap.get(item.index) ?? []}
              currentIndex={currentIndex}
              onNavigate={handleNavigate}
              isOpen={openIndex === item.index}
              onOpenChange={(open) => setOpenIndex(open ? item.index : null)}
            />
          </span>
        ))}
      </nav>
    );
  }
);

SectionBreadcrumb.displayName = 'SectionBreadcrumb';

export default SectionBreadcrumb;
