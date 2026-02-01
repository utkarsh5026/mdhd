import type { FlatSection, TreeSection } from './types';

const HEADING_LEVELS = {
  H1: 1,
  H2: 2,
  H3: 3,
} as const;

/**
 * Transforms a flat array of sections into a hierarchical tree structure
 * with proper parent-child relationships and local indexing.
 */
export function buildSectionTree(flatSections: FlatSection[]): TreeSection[] {
  const createTreeSection = (
    { title, level, id }: FlatSection,
    localIndex: number
  ): TreeSection => {
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

      result.push(createTreeSection(section, h1Counter));
    }

    if (section.level === HEADING_LEVELS.H2) {
      h2Counter++;
      h3Counter = 0;

      const parent = findLastHeading(result, HEADING_LEVELS.H1);
      if (parent) {
        parent.children.push(createTreeSection(section, h2Counter));
      } else {
        result.push(createTreeSection(section, h2Counter));
      }
      continue;
    }

    h3Counter++;
    const h1Parent = findLastHeading(result, HEADING_LEVELS.H1);
    const h2Parent = h1Parent ? findLastHeading(h1Parent.children, HEADING_LEVELS.H2) : null;

    if (h2Parent) {
      h2Parent.children.push(createTreeSection(section, h3Counter));
    } else if (h1Parent) {
      h1Parent.children.push(createTreeSection(section, h3Counter));
    } else {
      result.push(createTreeSection(section, h3Counter));
    }
  }

  return result;
}

/**
 * Returns the default set of expanded section IDs.
 * H1 sections (level 0 and 1) are expanded by default to show H2 children.
 * H2 sections (level 2) are collapsed by default to hide H3 children.
 */
export function getDefaultExpandedIds(sections: FlatSection[]): Set<number> {
  return new Set(
    sections
      .filter((section) => section.level === 0 || section.level === 1)
      .map((section) => section.id)
  );
}

/**
 * Finds all ancestor IDs for a given target section ID.
 * Used to auto-expand parent sections when navigating to a nested child.
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
