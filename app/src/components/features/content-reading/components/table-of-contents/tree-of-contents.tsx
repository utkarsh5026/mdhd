import { ChevronRight } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { buildSectionTree, findAncestorIds, getDefaultExpandedIds } from './tree-utils';
import type { FlatSection, TreeSection } from './types';

interface TreeOfContentsProps {
  sections: FlatSection[];
  currentIndex: number;
  readSections: Set<number>;
  showProgress: boolean;
  handleSelectCard: (index: number) => void;
}

const normalizeTitle = (title: string): string => {
  return title.replace(/^#+\s*/, '').trim();
};

const areSetsEqual = (a: Set<number>, b: Set<number>): boolean => {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

export const TreeOfContents = memo<TreeOfContentsProps>(
  ({ sections, currentIndex, readSections, showProgress, handleSelectCard }) => {
    // Build tree from flat sections
    const tree = useMemo(() => buildSectionTree(sections), [sections]);

    // Track expanded state - key is flat section id
    const [expandedIds, setExpandedIds] = useState<Set<number>>(() =>
      getDefaultExpandedIds(sections)
    );

    // Toggle expand/collapse
    const toggleExpanded = useCallback((id: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }, []);

    // Auto-expand parent when navigating to collapsed child
    useEffect(() => {
      const ancestorIds = findAncestorIds(tree, currentIndex);
      if (ancestorIds.length > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          let hasChanges = false;
          for (const id of ancestorIds) {
            if (!next.has(id)) {
              next.add(id);
              hasChanges = true;
            }
          }
          return hasChanges ? next : prev;
        });
      }
    }, [currentIndex, tree]);

    // Reset expanded state when content changes
    useEffect(() => {
      setExpandedIds(getDefaultExpandedIds(sections));
    }, [sections]);

    if (tree.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">No sections found</div>
      );
    }

    return (
      <div className="p-2">
        <div className="space-y-0.5">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              currentIndex={currentIndex}
              readSections={readSections}
              showProgress={showProgress}
              expandedIds={expandedIds}
              onToggleExpanded={toggleExpanded}
              onSelect={handleSelectCard}
            />
          ))}
        </div>
      </div>
    );
  }
);

TreeOfContents.displayName = 'TreeOfContents';

// TreeNode Component (Recursive)

interface TreeNodeProps {
  node: TreeSection;
  depth: number;
  currentIndex: number;
  readSections: Set<number>;
  showProgress: boolean;
  expandedIds: Set<number>;
  onToggleExpanded: (id: number) => void;
  onSelect: (index: number) => void;
}

const TreeNode = memo<TreeNodeProps>(
  ({
    node,
    depth,
    currentIndex,
    readSections,
    showProgress,
    expandedIds,
    onToggleExpanded,
    onSelect,
  }) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isActive = node.id === currentIndex;
    const isRead = readSections.has(node.id);

    return (
      <>
        <TreeNodeButton
          node={node}
          depth={depth}
          isActive={isActive}
          isRead={isRead}
          showProgress={showProgress}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggleExpanded={() => onToggleExpanded(node.id)}
          onSelect={() => onSelect(node.id)}
        />

        {/* Children - render if expanded and has children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                currentIndex={currentIndex}
                readSections={readSections}
                showProgress={showProgress}
                expandedIds={expandedIds}
                onToggleExpanded={onToggleExpanded}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </>
    );
  },
  (prev, next) => {
    // Optimized comparison - only re-render when relevant props change
    return (
      prev.node === next.node &&
      prev.depth === next.depth &&
      prev.currentIndex === next.currentIndex &&
      prev.showProgress === next.showProgress &&
      prev.expandedIds === next.expandedIds &&
      areSetsEqual(prev.readSections, next.readSections) &&
      prev.onToggleExpanded === next.onToggleExpanded &&
      prev.onSelect === next.onSelect
    );
  }
);

TreeNode.displayName = 'TreeNode';

// TreeNodeButton Component

interface TreeNodeButtonProps {
  node: TreeSection;
  depth: number;
  isActive: boolean;
  isRead: boolean;
  showProgress: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelect: () => void;
}

const TreeNodeButton = memo<TreeNodeButtonProps>(
  ({
    node,
    depth,
    isActive,
    isRead,
    showProgress,
    hasChildren,
    isExpanded,
    onToggleExpanded,
    onSelect,
  }) => {
    const displayTitle = normalizeTitle(node.title);
    const paddingLeft = depth * 16 + 12; // Indentation based on depth

    const handleButtonClick = () => {
      if (hasChildren && !isExpanded) {
        // When collapsed, clicking button only expands (doesn't select yet)
        // This prevents closing sheets/menus before seeing the children
        onToggleExpanded();
      } else if (hasChildren && isExpanded && isActive) {
        // When expanded and already selected, clicking button collapses
        onToggleExpanded();
      } else {
        // Otherwise, clicking button selects
        onSelect();
      }
    };

    const handleChevronClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Chevron only toggles expansion, never selects
      onToggleExpanded();
    };

    return (
      <button
        style={{ paddingLeft: `${paddingLeft}px` }}
        className={cn(
          'group w-full text-left pr-3 py-1.5 rounded-md text-xs',
          'flex items-center gap-1.5',
          'transition-all duration-150',
          isActive && 'bg-primary/10 text-primary font-medium',
          !isActive && isRead && showProgress && 'text-muted-foreground/70',
          !isActive && !isRead && 'text-foreground/70 hover:bg-accent/40 hover:text-foreground'
        )}
        onClick={handleButtonClick}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <span
            onClick={handleChevronClick}
            className="p-0.5 hover:bg-secondary/60 rounded-sm cursor-pointer"
          >
            <ChevronRight
              className={cn(
                'h-2.5 w-2.5 text-muted-foreground/50 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
            />
          </span>
        ) : (
          <span className="w-3.5" />
        )}

        {/* Hierarchical number */}
        <span
          className={cn(
            'text-[10px] min-w-4 tabular-nums',
            isActive ? 'text-primary/60' : 'text-muted-foreground/40'
          )}
        >
          {node.localIndex}.
        </span>

        {/* Title */}
        <span className="line-clamp-2 flex-1 leading-snug">{displayTitle}</span>
      </button>
    );
  }
);

TreeNodeButton.displayName = 'TreeNodeButton';

export default TreeOfContents;
