import { parse as parseYaml } from 'yaml';

import type { HeadingLevel, MarkdownMetadata, MarkdownSection, ParseResult } from './types';

export type { HeadingLevel, MarkdownMetadata, MarkdownSection, ParseResult } from './types';

const AVERAGE_READING_SPEED_WPM = 250;

/**
 * Extracts YAML frontmatter from markdown content.
 *
 * Parses the `---` delimited YAML block at the start of the document and
 * returns both the parsed metadata and the remaining content without it.
 *
 * @param markdown - Raw markdown string potentially containing frontmatter.
 * @returns An object with the stripped `content`, parsed `metadata` (or `null`),
 *   and `frontmatterLineCount` for accurate line-number tracking.
 */
function extractFrontmatter(markdown: string): {
  content: string;
  metadata: MarkdownMetadata | null;
  frontmatterLineCount: number;
  frontmatterError?: string;
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const match = frontmatterRegex.exec(markdown);

  if (!match) {
    return { content: markdown, metadata: null, frontmatterLineCount: 0 };
  }

  try {
    const yamlContent = match[1];
    const data = parseYaml(yamlContent) as MarkdownMetadata;
    const content = markdown.slice(match[0].length);
    const hasMetadata = data && typeof data === 'object' && Object.keys(data).length > 0;
    const frontmatterLineCount = match[0].split('\n').length - (match[0].endsWith('\n') ? 1 : 0);

    return {
      content,
      metadata: hasMetadata ? data : null,
      frontmatterLineCount,
    };
  } catch (e) {
    console.error('Failed to parse frontmatter YAML:', e);
    return {
      content: markdown,
      metadata: null,
      frontmatterLineCount: 0,
      frontmatterError: e instanceof Error ? e.message : 'Invalid YAML frontmatter',
    };
  }
}

/**
 * Strips markdown formatting to produce plain text for word counting.
 *
 * Removes code blocks, inline code, headings, links, images,
 * bold/italic markers, and HTML tags.
 *
 * @param text - Raw markdown text to clean.
 * @returns Plain text with all markdown syntax removed.
 */
function removeMarkdownFormatting(text: string): string {
  let cleanText = text;

  // Remove code blocks
  cleanText = cleanText.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  cleanText = cleanText.replace(/`[^`]*`/g, '');

  // Remove headings
  cleanText = cleanText.replace(/^#{1,6}\s+/gm, '');

  // Remove links but keep link text
  cleanText = cleanText.replace(/\[([^\]]+)]\([^)]+\)/g, '$1');

  // Remove images
  cleanText = cleanText.replace(/!\[[^\]]*]\([^)]+\)/g, '');

  // Remove bold/italic formatting
  cleanText = cleanText.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleanText = cleanText.replace(/([*_])(.*?)\1/g, '$2');

  // Remove HTML tags
  cleanText = cleanText.replace(/<[^>]*>/g, '');

  return cleanText;
}

/**
 * Counts the number of words in a markdown string.
 *
 * Strips markdown formatting first, then splits on whitespace.
 *
 * @param text - Markdown text to count words in.
 * @returns The number of words, or `0` if the input is empty/falsy.
 */
export function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  const cleanText = removeMarkdownFormatting(text);
  const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Estimates reading time in milliseconds for a given word count.
 *
 * @param wordCount - Total number of words to read.
 * @param readingSpeed - Words per minute (defaults to 250 WPM).
 * @returns Estimated reading time in milliseconds (minimum 1 minute).
 */
export function estimateReadingTime(
  wordCount: number,
  readingSpeed = AVERAGE_READING_SPEED_WPM
): number {
  const minutes = Math.max(1, wordCount / readingSpeed);
  return minutes * 60 * 1000;
}
/**
 * Parses raw markdown into navigable sections split by headings (H1–H3).
 *
 * Splits the document at each heading boundary, preserving code blocks
 * intact. Content before the first heading becomes an "Introduction" section.
 * YAML frontmatter is extracted separately as metadata. Each section includes
 * accurate `startLine`/`endLine` offsets and a computed `wordCount`.
 *
 * @param markdown - The full raw markdown string to parse.
 * @returns A `ParseResult` containing the ordered `sections` array and
 *   optional `metadata` from frontmatter.
 */
export const parseMarkdownIntoSections = (markdown: string): ParseResult => {
  const { content, metadata, frontmatterLineCount, frontmatterError } =
    extractFrontmatter(markdown);
  const lines = content.split('\n');
  const totalLines = markdown.split('\n').length;
  const sections: MarkdownSection[] = [];

  let currentSection: MarkdownSection | null = null;
  let inCodeBlock = false;
  let introContent = '';
  const introStartLine = frontmatterLineCount;
  const seenSlugs = new Map<string, number>();

  const pushIntroContent = (endLine: number) => {
    if (introContent.trim()) {
      sections.push({
        id: 'introduction',
        title: 'Introduction',
        content: introContent,
        level: 0,
        wordCount: 0,
        startLine: introStartLine,
        endLine,
      });
      introContent = '';
    }
  };

  const initializeSection = (
    title: string,
    level: HeadingLevel,
    startLine: number
  ): MarkdownSection => {
    const pounds = '#'.repeat(level);
    let slug = slugify(title);
    const count = seenSlugs.get(slug) ?? 0;
    seenSlugs.set(slug, count + 1);
    if (count > 0) {
      slug = `${slug}-${count}`;
    }
    return {
      id: slug,
      title,
      content: pounds + ' ' + title + '\n',
      level,
      wordCount: 0,
      startLine,
      endLine: 0,
    };
  };

  const handleHeading = (title: string, level: HeadingLevel, absoluteLine: number) => {
    if (currentSection) {
      currentSection.endLine = absoluteLine;
      sections.push(currentSection);
    } else if (introContent.trim()) {
      pushIntroContent(absoluteLine);
    }
    currentSection = initializeSection(title, level, absoluteLine);
  };

  for (let i = 0; i < lines.length; i++) {
    const absoluteLine = i + frontmatterLineCount;
    const line = lines[i].trimEnd();

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentSection !== null) {
        (currentSection as MarkdownSection).content += line + '\n';
      } else introContent += line + '\n';
      continue;
    }

    if (inCodeBlock) {
      if (currentSection !== null) {
        (currentSection as MarkdownSection).content += line + '\n';
      } else introContent += line + '\n';
      continue;
    }

    if (line.startsWith('#')) {
      const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const depth = headingMatch[1].length as 1 | 2 | 3;
        const title = headingMatch[2].trim();
        handleHeading(title, depth, absoluteLine);
        continue;
      }
    }

    if (currentSection !== null) {
      (currentSection as MarkdownSection).content += line + '\n';
    } else {
      introContent += line + '\n';
    }
  }

  if (currentSection) {
    (currentSection as MarkdownSection).endLine = totalLines;
    sections.push(currentSection);
  } else if (introContent.trim()) {
    sections.push({
      id: 'introduction',
      title: 'Introduction',
      content: introContent,
      level: 0,
      wordCount: 0,
      startLine: introStartLine,
      endLine: totalLines,
    });
  }

  const finalSections = sections.map((section) => ({
    ...section,
    wordCount: countWords(section.content),
  }));

  return {
    sections: finalSections,
    metadata,
    ...(frontmatterError && { frontmatterError }),
  };
};

/**
 * Converts a heading string into a URL-friendly slug for use as a section ID.
 *
 * Lowercases the text, strips non-word characters, and replaces whitespace
 * with hyphens.
 *
 * @param text - The heading text to slugify.
 * @returns A lowercase, hyphen-separated slug string.
 *
 * @example
 * slugify('Getting Started!') // => 'getting-started'
 * slugify('API v2 — Overview') // => 'api-v2--overview'
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};
