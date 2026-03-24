import type { FlatSection, IndexedSection, MarkdownSection, TreeSection } from './types';

const HEADING_LEVELS = {
  H1: 1,
  H2: 2,
  H3: 3,
} as const;

/**
 * Walks backwards from `currentIndex` to build the ancestor heading chain.
 *
 * Collects the nearest section at each strictly-decreasing heading level, stopping
 * at level 1. The current section is always appended as the final item.
 *
 * @param sections - The flat array of all parsed markdown sections.
 * @param currentIndex - Index of the section currently being viewed.
 * @returns Ordered array of ancestor `IndexedSection`s ending with the current section.
 */
export function getAncestors(sections: MarkdownSection[], currentIndex: number): IndexedSection[] {
  const current = sections[currentIndex];
  if (!current) return [];

  const ancestors: IndexedSection[] = [];
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
 * Returns the direct children of a section — sections at `level + 1` that fall
 * within the scope of the parent (before the next section at the same or higher level).
 *
 * @param sections - The flat array of all parsed markdown sections.
 * @param parentIndex - Index of the parent section whose children are needed.
 * @returns Array of `IndexedSection`s representing the immediate child sections.
 */
export function getDirectChildren(
  sections: MarkdownSection[],
  parentIndex: number
): IndexedSection[] {
  const parent = sections[parentIndex];
  if (!parent) return [];

  const parentLevel = parent.level;
  const childLevel = parentLevel + 1;

  let scopeEnd = sections.length;
  for (let i = parentIndex + 1; i < sections.length; i++) {
    const s = sections[i];
    if (s.level > 0 && s.level <= parentLevel) {
      scopeEnd = i;
      break;
    }
  }

  const children: IndexedSection[] = [];
  for (let i = parentIndex + 1; i < scopeEnd; i++) {
    if (sections[i].level === childLevel) {
      children.push({ section: sections[i], index: i });
    }
  }

  return children;
}

/**
 * Finds the section index that contains a given line number.
 *
 * Searches backwards from the end, returning the last section whose
 * `startLine` is less than or equal to `line`.
 *
 * @param line - The zero-based line number to look up.
 * @param sections - The flat array of parsed sections with `startLine` offsets.
 * @returns The index of the matching section, or `0` if none match.
 */
export function findSectionByLine(line: number, sections: MarkdownSection[]): number {
  for (let i = sections.length - 1; i >= 0; i--) {
    if (line >= sections[i].startLine) {
      return i;
    }
  }
  return 0;
}

/**
 * Maps a `MarkdownSection[]` to the `FlatSection[]` format used by tree/TOC components.
 *
 * Each flat section's `id` is set to its array index, providing a stable
 * numeric identifier for navigation callbacks.
 *
 * @param sections - The parsed markdown sections to convert.
 * @returns A new array of `FlatSection` objects in the same order.
 */
export function toFlatSections(sections: MarkdownSection[]): FlatSection[] {
  return sections.map((section, index) => ({
    id: index,
    title: section.title,
    level: section.level,
  }));
}

/**
 * Transforms a flat array of sections into a hierarchical tree structure.
 *
 * Nests H2 sections under the nearest preceding H1, and H3 sections under
 * the nearest preceding H2 (or H1 if no H2 exists). Each node receives a
 * 1-based `localIndex` within its parent for display numbering.
 *
 * @param flatSections - Flat, document-order array of sections to nest.
 * @returns A tree of `TreeSection` nodes with populated `children` arrays.
 */
export function buildSectionTree(flatSections: FlatSection[]): TreeSection[] {
  const treeSec = ({ title, level, id }: FlatSection, localIndex: number): TreeSection => {
    return {
      id,
      title,
      level,
      localIndex,
      children: [],
    };
  };

  const findLastHeading = (
    sections: TreeSection[],
    level: (typeof HEADING_LEVELS)[keyof typeof HEADING_LEVELS]
  ): TreeSection | null => {
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].level <= level) {
        return sections[i];
      }
    }
    return null;
  };

  const result: TreeSection[] = [];
  let h1Counter = 0;
  let h2Counter = 0;
  let h3Counter = 0;

  for (const section of flatSections) {
    if (section.level === 0 || section.level === HEADING_LEVELS.H1) {
      h1Counter++;
      h2Counter = 0;
      h3Counter = 0;

      result.push(treeSec(section, h1Counter));
    }

    if (section.level === HEADING_LEVELS.H2) {
      h2Counter++;
      h3Counter = 0;

      const parent = findLastHeading(result, HEADING_LEVELS.H1);
      if (parent) {
        parent.children.push(treeSec(section, h2Counter));
      } else {
        result.push(treeSec(section, h2Counter));
      }
      continue;
    }

    h3Counter++;
    const h1Parent = findLastHeading(result, HEADING_LEVELS.H1);
    const h2Parent = h1Parent ? findLastHeading(h1Parent.children, HEADING_LEVELS.H2) : null;

    if (h2Parent) {
      h2Parent.children.push(treeSec(section, h3Counter));
    } else if (h1Parent) {
      h1Parent.children.push(treeSec(section, h3Counter));
    } else {
      result.push(treeSec(section, h3Counter));
    }
  }

  return result;
}

/**
 * Returns the default set of expanded section IDs for the TOC tree.
 *
 * H1 sections (level 0 and 1) are expanded by default to show H2 children.
 * H2+ sections are collapsed by default to hide deeper nesting.
 *
 * @param sections - Flat section array to derive expanded IDs from.
 * @returns A `Set` of section `id`s that should be expanded initially.
 */
export function getDefaultExpandedIds(sections: FlatSection[]): Set<number> {
  return new Set(
    sections
      .filter((section) => section.level === 0 || section.level === 1)
      .map((section) => section.id)
  );
}

/**
 * Finds all ancestor IDs for a given target section ID in a tree.
 *
 * Performs a depth-first search and collects the path of parent `id`s
 * leading to `targetId`. Used to auto-expand parent sections when
 * navigating to a nested child.
 *
 * @param tree - The root-level tree sections to search through.
 * @param targetId - The `id` of the section to find ancestors for.
 * @returns An array of ancestor `id`s in root-to-parent order, excluding `targetId`.
 */
export function findAncestorIds(tree: TreeSection[], targetId: number): number[] {
  const ancestors: number[] = [];

  function search(nodes: TreeSection[], path: number[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        ancestors.push(...path);
        return true;
      }
      if (node.children.length > 0) {
        if (search(node.children, [...path, node.id])) {
          return true;
        }
      }
    }
    return false;
  }

  search(tree, []);
  return ancestors;
}
