import { countWords } from "@/services/analytics/word-count-estimation";

export type MarkdownSection = {
  id: string;
  title: string;
  content: string;
  level: 0 | 1 | 2;
  wordCount: number;
};

/**
 * 📚 Transforms markdown content into navigable sections!
 *
 * This function takes raw markdown text and intelligently breaks it down into
 * structured sections based on headings. It preserves code blocks, handles
 * introduction content, and calculates word counts for each section.
 *
 * 🧩 Perfect for creating a table of contents or a sectioned reading experience!
 */
export const parseMarkdownIntoSections = (
  markdown: string
): MarkdownSection[] => {
  const lines = markdown.split("\n");
  const sections: MarkdownSection[] = [];

  let currentSection: MarkdownSection | null = null;
  let inCodeBlock = false;
  let introContent = "";

  /**
   * 🏷️ Creates a special introduction section!
   *
   * Turns any content before the first heading into a nice introduction section.
   */
  const pushIntroContent = () => {
    if (introContent.trim()) {
      sections.push({
        id: "introduction",
        title: "Introduction",
        content: introContent,
        level: 0,
        wordCount: countWords(introContent),
      });
      introContent = "";
    }
  };

  /**
   * 🎨 Creates a fresh new section with the right formatting!
   *
   * Sets up a section with proper ID, title, and initial content.
   */
  const initializeSection = (title: string, level: 0 | 1 | 2) => {
    const pounds = "#".repeat(level);
    return {
      id: slugify(title),
      title,
      content: pounds + " " + title + "\n",
      level,
      wordCount: countWords(pounds + " " + title + "\n"),
    };
  };

  /**
   * 📝 Manages section transitions when a new heading is found!
   *
   * Saves the current section and prepares a new one.
   */
  const handleHeading = (title: string, level: 0 | 1 | 2) => {
    if (currentSection) sections.push(currentSection);
    else if (introContent.trim()) pushIntroContent();
    currentSection = initializeSection(title, level);
  };

  for (const markdownLine of lines) {
    const line = markdownLine.trimEnd();

    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      if (currentSection !== null) {
        (currentSection as MarkdownSection).content += line + "\n";
      } else introContent += line + "\n";
      continue;
    }

    if (inCodeBlock) {
      if (currentSection !== null) {
        (currentSection as MarkdownSection).content += line + "\n";
      } else introContent += line + "\n";
      continue;
    }

    const h1Regex = /^#\s+(.+)$/;
    const h2Regex = /^##\s+(.+)$/;
    const h1Match = h1Regex.exec(line);
    const h2Match = h2Regex.exec(line);

    switch (true) {
      case !!h1Match: {
        const title = h1Match[1].trim();
        handleHeading(title, 1);
        break;
      }

      case !!h2Match: {
        const title = h2Match[1].trim();
        handleHeading(title, 2);
        break;
      }

      case currentSection !== null: {
        (currentSection as MarkdownSection).content += line + "\n";
        break;
      }
      default: {
        introContent += line + "\n";
      }
    }
  }

  if (currentSection) sections.push(currentSection);
  else if (introContent.trim())
    sections.push({
      id: "introduction",
      title: "Introduction",
      content: introContent,
      level: 0,
      wordCount: countWords(introContent),
    });

  return sections.map((section) => ({
    ...section,
    wordCount: countWords(section.content),
  }));
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
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};
