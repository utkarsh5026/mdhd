/**
 * Tidies markdown produced by a converter into the shape the rest of MDHD expects.
 *
 * Word and Google Docs both emit a lot of structural noise that survives the
 * HTML round-trip: non-breaking spaces used as indentation, runs of empty
 * paragraphs used as vertical spacing, and stray zero-width characters. Section
 * parsing keys off blank-line boundaries, so unbounded blank runs would
 * otherwise produce sections full of whitespace.
 *
 * Trailing spaces are deliberately *not* stripped — two of them are a markdown
 * hard line break, which is how `<br>` survives the conversion.
 *
 * @param markdown - Raw converter output.
 * @returns Normalized markdown ending in exactly one newline (empty string if
 *   the document had no content).
 */
export function normalizeMarkdown(markdown: string): string {
  const normalized = markdown
    .replace(/\r\n?/g, '\n')
    // Zero-width chars survive copy-paste into Docs and corrupt inline spans.
    // Listed as alternatives rather than a character class: ZWJ is a combining
    // character, and grouping it with the others trips no-misleading-character-class.
    .replace(/\u200b|\u200c|\u200d|\ufeff/g, '')
    // Word uses NBSP for layout, not meaning; left alone it renders as a
    // literal glyph and breaks list-marker detection at line starts.
    .replace(/\u00a0/g, ' ')
    // Collapse runs of blank lines (including ones holding only whitespace).
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
    .trim();

  return normalized ? `${normalized}\n` : '';
}

/**
 * Ensures the document opens with a level-1 heading.
 *
 * MDHD splits a document into reading sections at headings. Word and Google
 * Docs documents very often carry their title as styled body text rather than a
 * `Title`/`Heading 1` paragraph, which would leave the whole import as one
 * untitled section. When no `# ` heading exists at the top level, the source
 * filename is promoted into one.
 *
 * @param markdown - Normalized markdown.
 * @param title - Fallback title, typically the filename without its extension.
 * @returns Markdown guaranteed to start with an H1.
 */
export function ensureTitleHeading(markdown: string, title: string): string {
  if (!markdown.trim()) return `# ${title}\n`;
  if (/^#\s+\S/m.test(markdown)) return markdown;

  return `# ${title}\n\n${markdown}`;
}
