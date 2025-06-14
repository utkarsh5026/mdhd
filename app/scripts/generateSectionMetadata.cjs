const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const glob = require("glob");

const parseMarkdownIntoSections = (markdown) => {
  const lines = markdown.split("\n");
  const sections = [];

  let currentSection = null;
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
  const initializeSection = (title, level) => {
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
  const handleHeading = (title, level) => {
    if (currentSection) sections.push(currentSection);
    else if (introContent.trim()) pushIntroContent();
    currentSection = initializeSection(title, level);
  };

  for (const markdownLine of lines) {
    const line = markdownLine.trimEnd();

    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      if (currentSection !== null) {
        currentSection.content += line + "\n";
      } else introContent += line + "\n";
      continue;
    }

    if (inCodeBlock) {
      if (currentSection !== null) {
        currentSection.content += line + "\n";
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
        currentSection.content += line + "\n";
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

function removeMarkdownFormatting(text) {
  let cleanText = text;

  // Remove code blocks
  cleanText = cleanText.replace(/```[\s\S]*?```/g, "");

  // Remove inline code
  cleanText = cleanText.replace(/`[^`]*`/g, "");

  // Remove headings
  cleanText = cleanText.replace(/^#{1,6}\s+/gm, "");

  // Remove links but keep link text
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove images
  cleanText = cleanText.replace(/!\[[^\]]*\]\([^)]+\)/g, "");

  // Remove bold/italic formatting
  cleanText = cleanText.replace(/(\*\*|__)(.*?)\1/g, "$2");
  cleanText = cleanText.replace(/(\*|_)(.*?)\1/g, "$2");

  // Remove HTML tags
  cleanText = cleanText.replace(/<[^>]*>/g, "");

  return cleanText;
}

// Function to count words (same as in your codebase)
function countWords(text) {
  if (!text || typeof text !== "string") {
    return 0;
  }

  // Remove markdown formatting to get cleaner text
  const cleanText = removeMarkdownFormatting(text);

  // Split by whitespace and filter out empty strings
  const words = cleanText.split(/\s+/).filter((word) => word.length > 0);

  return words.length;
}

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// Function to process a single markdown file
async function processMarkdownFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, "utf8");

    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Parse sections
    const sections = parseMarkdownIntoSections(markdownContent);

    // Enhance with word counts if not already included
    const enhancedSections = sections.map((section) => ({
      ...section,
      wordCount: section.wordCount || countWords(section.content),
    }));

    // Create a lightweight version without full content (to keep metadata small)
    const metadataSections = enhancedSections.map(
      ({ id, title, level, wordCount }) => ({
        id,
        title,
        level,
        wordCount,
      })
    );

    // Generate total document metadata
    const totalWordCount = enhancedSections.reduce(
      (sum, section) => sum + section.wordCount,
      0
    );
    const estimatedReadingTime = Math.ceil(totalWordCount / 250) * 60 * 1000; // 250 WPM in ms

    return {
      path: filePath.replace(/^public\/content\//, ""), // Store relative path
      sections: metadataSections,
      totalWordCount,
      estimatedReadingTime,
      title: frontmatter.title || path.basename(filePath, ".md"),
      frontmatter,
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

// Main function to generate metadata for all markdown files
async function generateSectionMetadata() {
  // Find all markdown files in content directory
  const files = glob.sync("public/content/**/*.md");

  console.log(`Found ${files.length} markdown files to process`);

  // Process each file
  const results = await Promise.all(files.map(processMarkdownFile));

  // Filter out any failures
  const metadata = results.filter(Boolean);

  // Create a map for easy lookup by file path
  const metadataMap = {};
  metadata.forEach((item) => {
    metadataMap[item.path] = item;
  });

  // Write to section-metadata.json
  fs.writeFileSync(
    "public/content/section-metadata.json",
    JSON.stringify(metadataMap, null, 2)
  );

  console.log(`Generated section metadata for ${metadata.length} files`);

  // Also update the existing index.json if needed
  // This depends on your current index.json structure...
}

// Run the script
generateSectionMetadata().catch((err) => {
  console.error("Failed to generate section metadata:", err);
  process.exit(1);
});
