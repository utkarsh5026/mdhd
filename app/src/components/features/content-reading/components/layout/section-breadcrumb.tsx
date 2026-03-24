import { Check, ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscMarkdown, VscSymbolClass, VscSymbolMethod, VscSymbolNamespace } from 'react-icons/vsc';
import { toast } from 'sonner';

import { useFileTree } from '@/components/features/file-explorer/store/file-store';
import { useTabsActions } from '@/components/features/tabs/store/hooks';
import {
  ListPopover,
  ListPopoverContent,
  ListPopoverItem,
  ListPopoverTrigger,
} from '@/components/ui/list-popover';
import { cn } from '@/lib/utils';
import { fileStorageDB, type FileTreeNode } from '@/services/indexeddb';
import { getAncestors, getDirectChildren } from '@/services/section/queries';
import type { IndexedSection } from '@/services/section/types';

import { useReadingContent, useReadingNavigation, useReadingSections } from '../../hooks';
import styles from './section-breadcrumb.module.css';

/** One resolved step in the file-system path shown before the section breadcrumbs. */
interface PathSegment {
  node: FileTreeNode;
  /** All nodes at this level — used by the file segment to show sibling files */
  siblings: FileTreeNode[];
}

/** Props for the `SectionBreadcrumb` compound navigation component. */
interface SectionBreadcrumbProps {
  onNavigate?: (index: number) => void;
  /** Controls visual style and scroll behavior:
   *  'standalone' — floating pill with background (default, used in inline reading mode)
   *  'inline'     — no background, no-wrap + hidden overflow scroll, for the desktop header row
   *  'mobile'     — no background, horizontal scroll row, for the mobile header row
   */
  variant?: 'standalone' | 'inline' | 'mobile';
}

/** Maps heading depth (0–3) to the VSCode-style icon component used in breadcrumb buttons. */
const LEVEL_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  0: VscMarkdown,
  1: VscSymbolNamespace,
  2: VscSymbolClass,
  3: VscSymbolMethod,
};

/** Maps heading depth (0–3) to the Tailwind text-color class applied to breadcrumb icons. */
const LEVEL_COLORS: Record<number, string> = {
  0: 'text-muted-foreground',
  1: 'text-primary',
  2: 'text-primary/75',
  3: 'text-primary/55',
};

/**
 * Walks the file tree to extract `PathSegment`s for a given `sourcePath`.
 *
 * Each segment carries the matched `FileTreeNode` and its siblings at that level.
 * Traversal stops at the first unmatched path part or when a file node is reached.
 *
 * @param fileTree   - Root-level nodes of the IndexedDB file tree.
 * @param sourcePath - Slash-separated file path, e.g. `"docs/guide/readme.md"`.
 * @returns Ordered array of `PathSegment`s from the root down to the matched file.
 */
function buildPathSegments(fileTree: FileTreeNode[], sourcePath: string): PathSegment[] {
  if (!sourcePath) return [];

  const parts = sourcePath.split('/').filter(Boolean);
  const segments: PathSegment[] = [];
  let currentNodes = fileTree;

  for (const part of parts) {
    const node = currentNodes.find((n) => n.name === part);
    if (!node) break;
    segments.push({ node, siblings: currentNodes });
    if (node.type === 'directory') {
      currentNodes = node.children ?? [];
    } else {
      break;
    }
  }

  return segments;
}

/** Props for the `PathNodeDropdown` breadcrumb segment button. */
interface PathNodeDropdownProps {
  segment: PathSegment;
  onOpenFile: (node: FileTreeNode) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'standalone' | 'inline' | 'mobile';
}

const PathNodeDropdown: React.FC<PathNodeDropdownProps> = memo(
  ({ segment, onOpenFile, isOpen, onOpenChange, variant = 'standalone' }) => {
    const { node, siblings } = segment;
    const isDir = node.type === 'directory';

    // Directories show their contents; files show sibling nodes
    const dropdownItems = isDir ? (node.children ?? []) : siblings;
    const hasDropdown = dropdownItems.length > 0;

    const handleSelect = useCallback(
      (child: FileTreeNode) => {
        if (child.type !== 'file') return;
        onOpenChange(false);
        onOpenFile(child);
      },
      [onOpenFile, onOpenChange]
    );

    const IconComp = isDir ? Folder : File;

    return (
      <ListPopover open={isOpen} onOpenChange={hasDropdown ? onOpenChange : undefined}>
        <ListPopoverTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 rounded-md px-1.5 py-0.5',
              'transition-colors',
              hasDropdown
                ? 'hover:text-foreground hover:bg-accent/40 cursor-pointer'
                : 'cursor-default',
              isDir ? 'text-muted-foreground/60' : 'text-foreground/90 font-medium bg-accent/30'
            )}
            title={node.name}
            disabled={!hasDropdown}
          >
            <IconComp
              className={cn(
                'h-3 w-3 shrink-0',
                isDir ? 'text-muted-foreground/60' : 'text-primary'
              )}
            />
            <span
              className={cn(
                variant === 'inline'
                  ? 'whitespace-nowrap'
                  : cn('truncate', variant === 'mobile' ? 'max-w-44' : 'max-w-32')
              )}
            >
              {node.name}
            </span>
            {hasDropdown && (
              <ChevronDown
                className={cn(
                  'h-2.5 w-2.5 shrink-0 text-muted-foreground/40 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            )}
          </button>
        </ListPopoverTrigger>

        {hasDropdown && (
          <ListPopoverContent title={isDir ? 'Contents' : 'Siblings'}>
            {dropdownItems.map((child) => {
              const ChildIcon = child.type === 'directory' ? Folder : File;
              const isActive = child.id === node.id;
              const isClickable = child.type === 'file';

              return (
                <ListPopoverItem
                  key={child.id}
                  isActive={isActive}
                  disabled={!isClickable}
                  onClick={() => handleSelect(child)}
                  icon={
                    <ChildIcon
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        child.type === 'directory' ? 'text-muted-foreground' : 'text-primary'
                      )}
                    />
                  }
                  suffix={isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                >
                  {child.name}
                </ListPopoverItem>
              );
            })}
          </ListPopoverContent>
        )}
      </ListPopover>
    );
  }
);

PathNodeDropdown.displayName = 'PathNodeDropdown';

/** Props for the `BreadcrumbDropdown` section-heading segment button. */
interface BreadcrumbDropdownProps {
  item: IndexedSection;
  children: IndexedSection[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'standalone' | 'inline' | 'mobile';
}

const BreadcrumbDropdown: React.FC<BreadcrumbDropdownProps> = memo(
  ({ item, children, currentIndex, onNavigate, isOpen, onOpenChange, variant = 'standalone' }) => {
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
      <ListPopover open={isOpen} onOpenChange={hasChildren ? onOpenChange : undefined}>
        <ListPopoverTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 rounded-md px-1.5 py-0.5',
              'transition-colors',
              hasChildren
                ? 'hover:text-foreground hover:bg-accent/40 cursor-pointer'
                : 'cursor-default',
              isCurrent ? 'text-foreground/90 font-medium bg-accent/30' : 'text-muted-foreground/60'
            )}
            title={item.section.title}
            disabled={!hasChildren}
          >
            <Icon
              className={cn('h-3 w-3 shrink-0', isCurrent ? iconColor : 'text-muted-foreground/50')}
            />
            <span
              className={cn(
                variant === 'inline'
                  ? 'whitespace-nowrap'
                  : cn('truncate', variant === 'mobile' ? 'max-w-44' : 'max-w-32')
              )}
            >
              {item.section.title}
            </span>
            {hasChildren && (
              <ChevronDown
                className={cn(
                  'h-2.5 w-2.5 shrink-0 text-muted-foreground/40 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            )}
          </button>
        </ListPopoverTrigger>

        {hasChildren && (
          <ListPopoverContent title={`${childLevelLabel} subsections`}>
            {children.map((child) => {
              const ChildIcon = LEVEL_ICONS[child.section.level] ?? VscMarkdown;
              const childColor = LEVEL_COLORS[child.section.level] ?? 'text-muted-foreground';
              const isActive = child.index === currentIndex;

              return (
                <ListPopoverItem
                  key={child.index}
                  isActive={isActive}
                  onClick={() => handleSelect(child.index)}
                  icon={<ChildIcon className={cn('h-3.5 w-3.5 shrink-0', childColor)} />}
                  suffix={isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                >
                  {child.section.title}
                </ListPopoverItem>
              );
            })}
          </ListPopoverContent>
        )}
      </ListPopover>
    );
  }
);

BreadcrumbDropdown.displayName = 'BreadcrumbDropdown';

const SectionBreadcrumb: React.FC<SectionBreadcrumbProps> = memo(
  ({ onNavigate, variant = 'standalone' }) => {
    const sections = useReadingSections();
    const { currentIndex } = useReadingNavigation();
    const { sourcePath } = useReadingContent();
    const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(null);
    const [openPathIndex, setOpenPathIndex] = useState<number | null>(null);
    const navRef = useRef<HTMLElement>(null);

    const fileTree = useFileTree();
    const { createTab, setActiveTab, findTabByFileId, setShowEmptyState } = useTabsActions();

    const pathSegments = useMemo(
      () => (sourcePath ? buildPathSegments(fileTree, sourcePath) : []),
      [fileTree, sourcePath]
    );

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

    const handleOpenFile = useCallback(
      async (node: FileTreeNode) => {
        if (node.type !== 'file') return;

        const existingTab = findTabByFileId(node.id);
        if (existingTab) {
          setActiveTab(existingTab.id);
          setShowEmptyState(false);
          return;
        }

        try {
          const file = await fileStorageDB.getFile(node.id);
          if (!file) {
            toast.error(`File "${node.name}" not found — it may have been deleted`);
            return;
          }

          createTab(file.content, file.name, 'file', file.id, file.path);
        } catch {
          toast.error(`Failed to open "${node.name}"`);
        }
      },
      [createTab, setActiveTab, findTabByFileId, setShowEmptyState]
    );

    useEffect(() => {
      if (variant === 'standalone') return;
      const nav = navRef.current;
      if (!nav) return;
      nav.scrollTo({ left: nav.scrollWidth, behavior: 'smooth' });
    }, [breadcrumbs, pathSegments, variant]);

    const hasPathSegments = pathSegments.length > 0;
    const hasSectionBreadcrumbs =
      breadcrumbs.length > 1 || (sections[currentIndex]?.level ?? 0) > 1;

    if (!hasPathSegments && !hasSectionBreadcrumbs) {
      return null;
    }

    return (
      <nav
        ref={navRef}
        aria-label="Section breadcrumb"
        className={cn(
          'flex items-center gap-0.5 text-xs text-muted-foreground',
          variant === 'standalone' && [
            'flex-wrap',
            'rounded-md px-1.5 py-1',
            'bg-background/60 backdrop-blur-sm',
          ],
          variant === 'mobile' && 'flex-nowrap overflow-x-auto',
          variant === 'inline' && 'flex-nowrap'
        )}
      >
        {/* File path segments */}
        {pathSegments.map((segment, idx) => (
          <span key={segment.node.id} className={cn('flex items-center shrink-0', styles.segment)}>
            {idx > 0 && (
              <ChevronRight
                className={cn('h-3 w-3 text-muted-foreground/30 shrink-0', styles.separator)}
              />
            )}
            <PathNodeDropdown
              segment={segment}
              onOpenFile={handleOpenFile}
              isOpen={openPathIndex === idx}
              onOpenChange={(open) => setOpenPathIndex(open ? idx : null)}
              variant={variant}
            />
          </span>
        ))}

        {/* Separator between path and section breadcrumbs */}
        {hasPathSegments && hasSectionBreadcrumbs && (
          <ChevronRight
            className={cn('h-3 w-3 text-muted-foreground/25 shrink-0', styles.separator)}
          />
        )}

        {/* Section breadcrumbs — key includes position so trail changes trigger re-mount */}
        {breadcrumbs.map((item, idx) => (
          <span
            key={`${item.index}-${idx}`}
            className={cn('flex items-center shrink-0', styles.segment)}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {idx > 0 && (
              <ChevronRight
                className={cn('h-3 w-3 text-muted-foreground/30 shrink-0', styles.separator)}
                style={{ animationDelay: `${idx * 40}ms` }}
              />
            )}
            <BreadcrumbDropdown
              item={item}
              children={siblingsMap.get(item.index) ?? []}
              currentIndex={currentIndex}
              onNavigate={handleNavigate}
              isOpen={openSectionIndex === item.index}
              onOpenChange={(open) => setOpenSectionIndex(open ? item.index : null)}
              variant={variant}
            />
          </span>
        ))}
      </nav>
    );
  }
);

SectionBreadcrumb.displayName = 'SectionBreadcrumb';

export default SectionBreadcrumb;
