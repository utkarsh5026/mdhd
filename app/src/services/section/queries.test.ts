import { describe, expect, it } from 'vitest';

import {
  buildSectionTree,
  findAncestorIds,
  findSectionByLine,
  getAncestors,
  getDefaultExpandedIds,
  getDirectChildren,
  toFlatSections,
} from './queries';
import type { FlatSection, MarkdownSection } from './types';

function makeSection(
  overrides: Partial<MarkdownSection> & { level: MarkdownSection['level'] }
): MarkdownSection {
  return {
    id: overrides.id ?? 'sec',
    title: overrides.title ?? 'Section',
    content: overrides.content ?? '',
    level: overrides.level,
    wordCount: overrides.wordCount ?? 0,
    startLine: overrides.startLine ?? 0,
    endLine: overrides.endLine ?? 0,
  };
}

function flat(id: number, level: FlatSection['level'], title = `S${id}`): FlatSection {
  return { id, title, level };
}

describe('getAncestors', () => {
  const sections: MarkdownSection[] = [
    makeSection({ id: 'intro', title: 'Intro', level: 0 }),
    makeSection({ id: 'h1', title: 'H1', level: 1 }),
    makeSection({ id: 'h2a', title: 'H2a', level: 2 }),
    makeSection({ id: 'h3', title: 'H3', level: 3 }),
    makeSection({ id: 'h2b', title: 'H2b', level: 2 }),
  ];

  it('returns only the section itself for a top-level H1', () => {
    const result = getAncestors(sections, 1);
    expect(result).toHaveLength(1);
    expect(result[0].section.id).toBe('h1');
  });

  it('walks back to collect parent chain for an H3', () => {
    const result = getAncestors(sections, 3);
    expect(result.map((a) => a.section.id)).toEqual(['h1', 'h2a', 'h3']);
  });

  it('collects parent chain for an H2', () => {
    const result = getAncestors(sections, 2);
    expect(result.map((a) => a.section.id)).toEqual(['h1', 'h2a']);
  });

  it('returns empty array for out-of-bounds index', () => {
    expect(getAncestors(sections, 99)).toEqual([]);
    expect(getAncestors(sections, -1)).toEqual([]);
  });

  it('handles intro section (level 0) — level 0 stops immediately', () => {
    const result = getAncestors(sections, 0);
    expect(result).toHaveLength(1);
    expect(result[0].section.id).toBe('intro');
  });

  it('skips non-ancestor levels', () => {
    // H2b at index 4 should find H1 at index 1, skipping H3 at index 3
    const result = getAncestors(sections, 4);
    expect(result.map((a) => a.section.id)).toEqual(['h1', 'h2b']);
  });
});

describe('getDirectChildren', () => {
  const sections: MarkdownSection[] = [
    makeSection({ id: 'h1', title: 'H1', level: 1 }),
    makeSection({ id: 'h2a', title: 'H2a', level: 2 }),
    makeSection({ id: 'h3a', title: 'H3a', level: 3 }),
    makeSection({ id: 'h2b', title: 'H2b', level: 2 }),
    makeSection({ id: 'h1b', title: 'H1b', level: 1 }),
    makeSection({ id: 'h2c', title: 'H2c', level: 2 }),
  ];

  it('returns direct H2 children of an H1', () => {
    const children = getDirectChildren(sections, 0);
    expect(children.map((c) => c.section.id)).toEqual(['h2a', 'h2b']);
  });

  it('returns direct H3 children of an H2', () => {
    const children = getDirectChildren(sections, 1);
    expect(children.map((c) => c.section.id)).toEqual(['h3a']);
  });

  it('stops scope at next same-level heading', () => {
    // H1b (index 4) should only get H2c, not H2a/H2b
    const children = getDirectChildren(sections, 4);
    expect(children.map((c) => c.section.id)).toEqual(['h2c']);
  });

  it('returns empty for leaf sections', () => {
    const children = getDirectChildren(sections, 2); // H3a
    expect(children).toEqual([]);
  });

  it('returns empty for out-of-bounds index', () => {
    expect(getDirectChildren(sections, 99)).toEqual([]);
  });

  it('returns empty when section has no children', () => {
    const children = getDirectChildren(sections, 5); // H2c is last
    expect(children).toEqual([]);
  });
});

describe('findSectionByLine', () => {
  const sections: MarkdownSection[] = [
    makeSection({ level: 1, startLine: 0, endLine: 5 }),
    makeSection({ level: 2, startLine: 5, endLine: 10 }),
    makeSection({ level: 2, startLine: 10, endLine: 20 }),
  ];

  it('returns first section for line 0', () => {
    expect(findSectionByLine(0, sections)).toBe(0);
  });

  it('returns correct section for line in middle', () => {
    expect(findSectionByLine(7, sections)).toBe(1);
  });

  it('returns last section for line at its startLine', () => {
    expect(findSectionByLine(10, sections)).toBe(2);
  });

  it('returns last section for line beyond all sections', () => {
    expect(findSectionByLine(100, sections)).toBe(2);
  });

  it('returns 0 for empty sections array', () => {
    expect(findSectionByLine(5, [])).toBe(0);
  });

  it('returns section at exact startLine boundary', () => {
    expect(findSectionByLine(5, sections)).toBe(1);
  });
});

describe('toFlatSections', () => {
  it('maps sections to flat format with index-based ids', () => {
    const sections: MarkdownSection[] = [
      makeSection({ title: 'A', level: 1 }),
      makeSection({ title: 'B', level: 2 }),
    ];
    const flat = toFlatSections(sections);

    expect(flat).toEqual([
      { id: 0, title: 'A', level: 1 },
      { id: 1, title: 'B', level: 2 },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(toFlatSections([])).toEqual([]);
  });
});

describe('buildSectionTree', () => {
  it('nests H2 under preceding H1 (H1 also appears as own child)', () => {
    const sections = [flat(0, 1), flat(1, 2), flat(2, 2)];
    const tree = buildSectionTree(sections);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(3);
    expect(tree[0].children[0].id).toBe(0); // H1 self-copy
    expect(tree[0].children[1].id).toBe(1); // first H2
    expect(tree[0].children[2].id).toBe(2); // second H2
  });

  it('nests H3 under preceding H2', () => {
    const sections = [flat(0, 1), flat(1, 2), flat(2, 3)];
    const tree = buildSectionTree(sections);

    expect(tree[0].children[1].children).toHaveLength(1);
    expect(tree[0].children[1].children[0].id).toBe(2);
  });

  it('assigns correct localIndex counters', () => {
    const sections = [flat(0, 1), flat(1, 2), flat(2, 2), flat(3, 1), flat(4, 2)];
    const tree = buildSectionTree(sections);

    expect(tree[0].localIndex).toBe(1); // first H1
    // children[0] is H1 self-copy (localIndex=1), then H2s follow
    expect(tree[0].children[1].localIndex).toBe(1); // first H2 under first H1
    expect(tree[0].children[2].localIndex).toBe(2); // second H2 under first H1
    expect(tree[1].localIndex).toBe(2); // second H1
    // children[0] is H1 self-copy, children[1] is H2
    expect(tree[1].children[1].localIndex).toBe(1); // H2 counter resets under new H1
  });

  it('handles intro section (level 0) as top-level', () => {
    const sections = [flat(0, 0), flat(1, 1), flat(2, 2)];
    const tree = buildSectionTree(sections);

    // Both level 0 and level 1 are top-level
    expect(tree).toHaveLength(2);
  });

  it('handles orphan H2 with no preceding H1', () => {
    const sections = [flat(0, 2), flat(1, 2)];
    const tree = buildSectionTree(sections);

    // No H1 parent, so H2s become top-level
    expect(tree).toHaveLength(2);
  });

  it('handles H3 with no H2 parent — nests under nearest node', () => {
    const sections = [flat(0, 1), flat(1, 3)];
    const tree = buildSectionTree(sections);

    expect(tree).toHaveLength(1);
    // children[0] is H1 self-copy; H3 nests under it (findLastHeading treats it as H2-eligible)
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe(0); // H1 self-copy
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe(1); // H3 nested under self-copy
  });

  it('returns empty array for empty input', () => {
    expect(buildSectionTree([])).toEqual([]);
  });

  it('handles complex nested structure', () => {
    const sections = [
      flat(0, 1, 'Chapter 1'),
      flat(1, 2, 'Section 1.1'),
      flat(2, 3, 'Sub 1.1.1'),
      flat(3, 3, 'Sub 1.1.2'),
      flat(4, 2, 'Section 1.2'),
      flat(5, 1, 'Chapter 2'),
      flat(6, 2, 'Section 2.1'),
    ];
    const tree = buildSectionTree(sections);

    expect(tree).toHaveLength(2);
    // H1 self-copy + 2 H2s = 3 children for Chapter 1
    expect(tree[0].children).toHaveLength(3);
    expect(tree[0].children[0].id).toBe(0); // self-copy
    expect(tree[0].children[1].id).toBe(1); // Section 1.1
    expect(tree[0].children[1].children).toHaveLength(2); // Sub 1.1.1 and 1.1.2
    expect(tree[0].children[2].id).toBe(4); // Section 1.2
    expect(tree[0].children[2].children).toHaveLength(0);
    // Chapter 2: self-copy + Section 2.1
    expect(tree[1].children).toHaveLength(2);
  });
});

describe('getDefaultExpandedIds', () => {
  it('includes level 0 and level 1 sections', () => {
    const sections = [flat(0, 0), flat(1, 1), flat(2, 2), flat(3, 3)];
    const expanded = getDefaultExpandedIds(sections);

    expect(expanded.has(0)).toBe(true);
    expect(expanded.has(1)).toBe(true);
    expect(expanded.has(2)).toBe(false);
    expect(expanded.has(3)).toBe(false);
  });

  it('returns empty set for no top-level sections', () => {
    const sections = [flat(0, 2), flat(1, 3)];
    const expanded = getDefaultExpandedIds(sections);
    expect(expanded.size).toBe(0);
  });

  it('returns empty set for empty input', () => {
    expect(getDefaultExpandedIds([]).size).toBe(0);
  });
});

describe('findAncestorIds', () => {
  it('finds ancestor path in nested tree', () => {
    const sections = [flat(0, 1), flat(1, 2), flat(2, 3), flat(3, 2), flat(4, 1)];
    const tree = buildSectionTree(sections);
    const ancestors = findAncestorIds(tree, 2);

    // H3 (id=2) is under H2 (id=1) which is under H1 (id=0)
    expect(ancestors).toEqual([0, 1]);
  });

  it('returns empty for top-level section', () => {
    const sections = [flat(0, 1), flat(1, 2)];
    const tree = buildSectionTree(sections);
    expect(findAncestorIds(tree, 0)).toEqual([]);
  });

  it('returns empty for non-existent target', () => {
    const sections = [flat(0, 1)];
    const tree = buildSectionTree(sections);
    expect(findAncestorIds(tree, 99)).toEqual([]);
  });

  it('returns parent for H2 under H1', () => {
    const sections = [flat(0, 1), flat(1, 2)];
    const tree = buildSectionTree(sections);
    expect(findAncestorIds(tree, 1)).toEqual([0]);
  });

  it('returns empty for empty tree', () => {
    expect(findAncestorIds([], 0)).toEqual([]);
  });
});
