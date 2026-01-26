import { parseMarkdownIntoSections } from '@/services/section/parsing';
import type { Tab, TabReadingState } from './types';

/**
 * Simple hash function for content comparison
 */
export const hashString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return hash.toString();
};

/**
 * Generate a unique tab ID
 */
const generateTabId = (): string => {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Extract title from markdown content (first heading or truncated content)
 */
export const extractTitleFromMarkdown = (content: string): string => {
  const headingMatch = content.match(/^#+ (.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim().substring(0, 50);
  }

  const firstLine = content.split('\n')[0].trim();
  if (firstLine) {
    return firstLine.substring(0, 50) || 'Untitled';
  }

  return 'Untitled';
};

/**
 * Create initial reading state for a new tab
 */
export const createInitialReadingState = (content: string): TabReadingState => {
  const { metadata, sections } = content
    ? parseMarkdownIntoSections(content)
    : { metadata: {}, sections: [] };
  return {
    currentIndex: 0,
    readSections: new Set([0]),
    scrollProgress: 0,
    readingMode: 'card',
    viewMode: 'preview',
    sections,
    metadata,
    isInitialized: sections.length > 0,
    isZenMode: false,
    zenControlsVisible: false,
    isDialogOpen: false,
  };
};

export function createTab(
  content: string,
  title: string,
  source: {
    fileID?: string;
    path?: string;
    sType: 'paste' | 'file';
  }
): Tab {
  const now = Date.now();
  return {
    id: generateTabId(),
    title,
    content,
    contentHash: hashString(content),
    createdAt: now,
    lastAccessedAt: now,
    sourceType: source.sType,
    sourceFileId: source.fileID,
    sourcePath: source.path,
    readingState: createInitialReadingState(content),
  };
}
