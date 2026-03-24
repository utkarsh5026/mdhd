export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type MarkdownMetadata = Record<string, unknown>;

export type ParseResult = {
  sections: MarkdownSection[];
  metadata: MarkdownMetadata | null;
  frontmatterError?: string;
};

export type MarkdownSection = {
  id: string;
  title: string;
  content: string;
  level: HeadingLevel;
  wordCount: number;
  startLine: number;
  endLine: number;
};

/** A `MarkdownSection` paired with its zero-based index in the flat sections array. */
export interface IndexedSection {
  section: MarkdownSection;
  index: number;
}

export interface FlatSection {
  id: number;
  title: string;
  level: HeadingLevel;
}

export interface TreeSection {
  id: number;
  title: string;
  level: HeadingLevel;
  localIndex: number;
  children: TreeSection[];
}
