import { parse as parseYaml } from 'yaml';

const AVERAGE_READING_SPEED_WPM = 250;

export type MarkdownMetadata = Record<string, unknown>;

export type ParseResult = {
  sections: MarkdownSection[];
  metadata: MarkdownMetadata | null;
};

/**
 * Extracts YAML frontmatter from markdown content
 *
 * Returns the metadata object and the content without frontmatter
 */
function extractFrontmatter(markdown: string): {
  content: string;
  metadata: MarkdownMetadata | null;
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const match = frontmatterRegex.exec(markdown);

  if (!match) {
    return { content: markdown, metadata: null };
  }

  try {
    const yamlContent = match[1];
    const data = parseYaml(yamlContent) as MarkdownMetadata;
    const content = markdown.slice(match[0].length);
    const hasMetadata = data && typeof data === 'object' && Object.keys(data).length > 0;

    return {
      content,
      metadata: hasMetadata ? data : null,
    };
  } catch (e) {
    console.error('Failed to parse frontmatter YAML:', e);
    return { content: markdown, metadata: null };
  }
}

/**
 * 📝 Cleans up Markdown text to make word counting more accurate
 * Strips away all the fancy formatting so we can just count the actual words!
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
 * 🔢 Counts the number of words in a text
 * First cleans up any Markdown formatting, then splits by spaces to count!
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
 * ⏱️ Figures out how long it would take to read something
 * Uses average reading speed to estimate how many milliseconds you'd need!
 */
export function estimateReadingTime(
  wordCount: number,
  readingSpeed = AVERAGE_READING_SPEED_WPM
): number {
  const minutes = Math.max(1, wordCount / readingSpeed);
  return minutes * 60 * 1000;
}
export type MarkdownSection = {
  id: string;
  title: string;
  content: string;
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  wordCount: number;
};

/**
 * 📚 Transforms Markdown content into navigable sections!
 *
 * This function takes raw Markdown text and intelligently breaks it down into
 * structured sections based on headings. It preserves code blocks, handles
 * introduction content, and calculates word counts for each section.
 *
 * Also extracts YAML frontmatter metadata if present.
 *
 * 🧩 Perfect for creating a table of contents or a sectioned reading experience!
 */
export const parseMarkdownIntoSections = (markdown: string): ParseResult => {
  const { content, metadata } = extractFrontmatter(markdown);
  const lines = content.split('\n');
  const sections: MarkdownSection[] = [];

  let currentSection: MarkdownSection | null = null;
  let inCodeBlock = false;
  let introContent = '';

  /**
   * 🏷️ Creates a special introduction section!
   *
   * Turns any content before the first heading into a nice introduction section.
   */
  const pushIntroContent = () => {
    if (introContent.trim()) {
      sections.push({
        id: 'introduction',
        title: 'Introduction',
        content: introContent,
        level: 0,
        wordCount: countWords(introContent),
      });
      introContent = '';
    }
  };

  /**
   * 🎨 Creates a fresh new section with the right formatting!
   *
   * Sets up a section with proper ID, title, and initial content.
   */
  const initializeSection = (title: string, level: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
    const pounds = '#'.repeat(level);
    return {
      id: slugify(title),
      title,
      content: pounds + ' ' + title + '\n',
      level,
      wordCount: countWords(pounds + ' ' + title + '\n'),
    };
  };

  /**
   * 📝 Manages section transitions when a new heading is found!
   *
   * Saves the current section and prepares a new one.
   */
  const handleHeading = (title: string, level: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
    if (currentSection) sections.push(currentSection);
    else if (introContent.trim()) pushIntroContent();
    currentSection = initializeSection(title, level);
  };

  for (const markdownLine of lines) {
    const line = markdownLine.trimEnd();

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

    const h1Regex = /^#\s+(.+)$/;
    const h2Regex = /^##\s+(.+)$/;
    const h3Regex = /^###\s+(.+)$/;

    const h3Match = h3Regex.exec(line);
    const h2Match = h2Regex.exec(line);
    const h1Match = h1Regex.exec(line);

    switch (true) {
      case !!h3Match: {
        const title = h3Match[1].trim();
        handleHeading(title, 3);
        break;
      }

      case !!h2Match: {
        const title = h2Match[1].trim();
        handleHeading(title, 2);
        break;
      }

      case !!h1Match: {
        const title = h1Match[1].trim();
        handleHeading(title, 1);
        break;
      }

      case currentSection !== null: {
        (currentSection as MarkdownSection).content += line + '\n';
        break;
      }
      default: {
        introContent += line + '\n';
      }
    }
  }

  if (currentSection) sections.push(currentSection);
  else if (introContent.trim())
    sections.push({
      id: 'introduction',
      title: 'Introduction',
      content: introContent,
      level: 0,
      wordCount: countWords(introContent),
    });

  const finalSections = sections.map((section) => ({
    ...section,
    wordCount: countWords(section.content),
  }));

  return {
    sections: finalSections,
    metadata,
  };
};

/**
 * 🔤 Transforms text into URL-friendly slugs!
 *
 * Takes headings and converts them into clean IDs for navigation and linking.
 * Perfect for creating anchor links that match your section titles.
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
