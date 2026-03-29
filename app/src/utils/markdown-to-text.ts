/**
 * Strips markdown syntax from a string, producing plain text suitable for
 * speech synthesis. Code blocks are removed entirely (speaking code aloud
 * is not useful). Inline formatting, links, images, HTML tags, and table
 * syntax are simplified to their textual content.
 */
export function stripMarkdown(md: string): string {
  let text = md;

  // Remove fenced code blocks (``` or ~~~)
  text = text.replace(/^(`{3,}|~{3,})[\s\S]*?^\1/gm, '');

  // Remove inline code
  text = text.replace(/`([^`]*)`/g, '$1');

  // Remove images — keep alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Remove links — keep link text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Remove reference-style links
  text = text.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers
  text = text.replace(/(\*{1,3}|_{1,3})(.+?)\1/g, '$2');

  // Remove strikethrough
  text = text.replace(/~~(.+?)~~/g, '$1');

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // Remove blockquote markers
  text = text.replace(/^>\s?/gm, '');

  // Remove unordered list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');

  // Remove ordered list markers
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // Remove table pipe syntax — keep cell content separated by spaces
  text = text.replace(/\|/g, ' ');
  // Remove table separator rows (--- | --- | ---)
  text = text.replace(/^[\s:|-]+$/gm, '');

  // Remove footnote references
  text = text.replace(/\[\^[^\]]*\]/g, '');

  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  // Collapse multiple spaces
  text = text.replace(/ {2,}/g, ' ');

  return text.trim();
}
