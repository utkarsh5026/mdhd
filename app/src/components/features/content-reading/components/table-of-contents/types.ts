export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface FlatSection {
  id: number;
  title: string;
  level: HeadingLevel;
}

export interface TreeSection {
  id: number; // Original flat index (for navigation)
  title: string;
  level: HeadingLevel;
  localIndex: number; // 1-based index within parent
  children: TreeSection[];
}
