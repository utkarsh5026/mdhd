import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscMarkdown, VscSymbolClass, VscSymbolMethod, VscSymbolNamespace } from 'react-icons/vsc';

import { useFileTree } from '@/components/features/file-explorer/store/file-store';
import { useTabsActions } from '@/components/features/tabs/store/hooks';
import { cn } from '@/lib/utils';
import { fileStorageDB, type FileTreeNode } from '@/services/indexeddb';
import { getAncestors, getDirectChildren } from '@/services/section/queries';
import type { IndexedSection, MarkdownSection } from '@/services/section/types';

/** One resolved step in the file-system path shown before the section breadcrumbs. */
interface PathSegment {
  node: FileTreeNode;
  /** All nodes at this level — used by the file segment to show sibling files */
  siblings: FileTreeNode[];
}

/** Props for the `SectionBreadcrumb` compound navigation component. */
interface SectionBreadcrumbProps {
  sections: MarkdownSection[];
  currentIndex: number;
  onNavigate?: (index: number) => void;
  /** Full path of the current file, e.g. "/docs/guide/readme.md" */
  sourcePath?: string;
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

/**
 * Renders a single file-system path segment as a breadcrumb button.
 *
 * Directories open a popover listing their children; files open a popover
 * listing their siblings. Clicking a file entry invokes `onOpenFile`.
 *
 * @component
 * @param props.segment      - The resolved path node and its sibling list.
 * @param props.onOpenFile   - Called with the selected `FileTreeNode` when a file is chosen.
 * @param props.isOpen       - Whether this segment's popover is currently open.
 * @param props.onOpenChange - Callback to open or close this segment's popover.
 * @param props.variant      - Visual/layout variant inherited from `SectionBreadcrumb`.
 */
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
      <Popover.Root open={isOpen} onOpenChange={hasDropdown ? onOpenChange : undefined}>
        <Popover.Trigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 rounded px-1 py-0.5 font-cascadia-code',
              'transition-colors',
              hasDropdown
                ? 'hover:text-foreground hover:bg-accent/50 cursor-pointer'
                : 'cursor-default',
              isDir ? 'text-muted-foreground' : 'text-foreground/80 font-medium'
            )}
            title={node.name}
            disabled={!hasDropdown}
          >
            <IconComp
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isDir ? 'text-muted-foreground' : 'text-primary'
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
                  'h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            )}
          </button>
        </Popover.Trigger>

        {hasDropdown && (
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
                  {isDir ? 'Contents' : 'Siblings'}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1 scrollbar-none">
                {dropdownItems.map((child) => {
                  const ChildIcon = child.type === 'directory' ? Folder : File;
                  const isActive = child.id === node.id;
                  const isClickable = child.type === 'file';

                  return (
                    <button
                      key={child.id}
                      onClick={() => handleSelect(child)}
                      disabled={!isClickable}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left',
                        isClickable
                          ? 'transition-colors hover:bg-accent/50'
                          : 'opacity-50 cursor-default',
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                      )}
                    >
                      <ChildIcon
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          child.type === 'directory' ? 'text-muted-foreground' : 'text-primary'
                        )}
                      />
                      <span className="flex-1 truncate">{child.name}</span>
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

/**
 * Renders a single section-heading as a breadcrumb button with a subsection popover.
 *
 * When `children` is non-empty a chevron and popover list are shown. The active
 * section is highlighted. Selecting an entry calls `onNavigate` with its index.
 *
 * @component
 * @param props.item         - The section and its index to display as this crumb.
 * @param props.children     - Direct child sections shown in the dropdown.
 * @param props.currentIndex - The currently active section index (for highlight logic).
 * @param props.onNavigate   - Called with the target section index when a child is selected.
 * @param props.isOpen       - Whether this crumb's popover is currently open.
 * @param props.onOpenChange - Callback to open or close this crumb's popover.
 * @param props.variant      - Visual/layout variant inherited from `SectionBreadcrumb`.
 */
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
      <Popover.Root open={isOpen} onOpenChange={hasChildren ? onOpenChange : undefined}>
        <Popover.Trigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 rounded px-1 py-0.5 font-cascadia-code',
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
                  'h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform',
                  isOpen && 'rotate-180'
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

              <div className="max-h-64 overflow-y-auto py-1 scrollbar-none">
                {children.map((child) => {
                  const ChildIcon = LEVEL_ICONS[child.section.level] ?? VscMarkdown;
                  const childColor = LEVEL_COLORS[child.section.level] ?? 'text-muted-foreground';
                  const isActive = child.index === currentIndex;

                  return (
                    <button
                      key={child.index}
                      onClick={() => handleSelect(child.index)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left',
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

/**
 * Compound breadcrumb navigation showing the file-system path and the heading
 * ancestor chain for the currently active section.
 *
 * File-path segments each open a popover for navigating to sibling files or
 * directory contents. Section segments open a popover listing direct child
 * subsections. Returns `null` when there is nothing meaningful to display.
 *
 * Scrolls to the trailing edge on breadcrumb change when `variant` is not
 * `'standalone'`.
 *
 * @component
 * @param props.sections      - Flat array of all parsed markdown sections.
 * @param props.currentIndex  - Index of the section currently in view.
 * @param props.onNavigate    - Called with a section index when the user selects one.
 * @param props.sourcePath    - Optional slash-separated path of the open file.
 * @param props.variant       - Visual/layout variant; defaults to `'standalone'`.
 */
const SectionBreadcrumb: React.FC<SectionBreadcrumbProps> = memo(
  ({ sections, currentIndex, onNavigate, sourcePath, variant = 'standalone' }) => {
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

        const file = await fileStorageDB.getFile(node.id);
        if (!file) return;

        createTab(file.content, file.name, 'file', file.id, file.path);
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
          <span key={segment.node.id} className="flex items-center gap-0.5 shrink-0">
            {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
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
          <span className="flex items-center shrink-0">
            <ChevronRight className="h-3 w-3 text-muted-foreground/25 shrink-0" />
          </span>
        )}

        {/* Section breadcrumbs */}
        {breadcrumbs.map((item, idx) => (
          <span key={item.index} className="flex items-center gap-0.5 shrink-0">
            {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
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
