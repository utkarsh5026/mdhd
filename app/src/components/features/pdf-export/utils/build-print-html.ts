import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';

export interface PdfExportOptions {
  title: string;
  sections: MarkdownSection[];
  metadata: MarkdownMetadata | null;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  includeTableOfContents: boolean;
  includeMetadata: boolean;
  pageSize: 'a4' | 'letter' | 'legal';
}

const PAGE_SIZE_CSS: Record<PdfExportOptions['pageSize'], string> = {
  a4: 'A4',
  letter: 'letter',
  legal: 'legal',
};

/**
 * Collects all <style> and <link rel="stylesheet"> content from the current document.
 * This ensures the print document inherits the app's font-face declarations and theme styles.
 */
function collectDocumentStyles(): string {
  const styles: string[] = [];

  for (const sheet of document.styleSheets) {
    try {
      // Inline <style> tags — grab their text content directly
      if (sheet.ownerNode instanceof HTMLStyleElement) {
        styles.push(sheet.ownerNode.textContent ?? '');
        continue;
      }

      // <link> stylesheets — read the rules
      if (sheet.cssRules) {
        const rules: string[] = [];
        for (const rule of sheet.cssRules) {
          rules.push(rule.cssText);
        }
        styles.push(rules.join('\n'));
      }
    } catch {
      // Cross-origin stylesheets will throw — skip them
    }
  }

  return styles.join('\n');
}

function buildTableOfContents(sections: MarkdownSection[]): string {
  const items = sections
    .filter((s) => s.level > 0)
    .map((s) => {
      const indent = (s.level - 1) * 20;
      return `<li style="margin-left: ${indent}px; margin-bottom: 4px;">
        <span>${s.title}</span>
      </li>`;
    })
    .join('\n');

  return `
    <div class="pdf-toc">
      <h2 style="font-size: 1.3em; margin-bottom: 12px; font-weight: 600;">Table of Contents</h2>
      <ol style="list-style: decimal; padding-left: 20px; margin-bottom: 0;">${items}</ol>
    </div>
  `;
}

function buildMetadataBlock(metadata: MarkdownMetadata): string {
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );
  if (entries.length === 0) return '';

  const title = metadata.title as string | undefined;
  const otherEntries = entries.filter(([key]) => key !== 'title');

  const formatKey = (key: string): string =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();

  const metaItems = otherEntries
    .map(([key, value]) => {
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
      return `<span style="margin-right: 16px;"><strong>${formatKey(key)}:</strong> ${displayValue}</span>`;
    })
    .join('');

  return `
    <div class="pdf-metadata" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #ddd;">
      ${title ? `<h1 style="font-size: 1.8em; margin-bottom: 8px; font-weight: 700;">${title}</h1>` : ''}
      ${metaItems ? `<div style="font-size: 0.85em; color: #666;">${metaItems}</div>` : ''}
    </div>
  `;
}

/**
 * Builds a complete HTML document string optimized for print/PDF export.
 * The document uses the app's own stylesheets so fonts and markdown styling
 * carry over correctly into the printed output.
 */
export function buildPrintHtml(options: PdfExportOptions): string {
  const {
    title,
    sections,
    metadata,
    fontFamily,
    fontSize,
    lineHeight,
    includeTableOfContents,
    includeMetadata,
    pageSize,
  } = options;

  const appStyles = collectDocumentStyles();
  const pageCSS = PAGE_SIZE_CSS[pageSize];

  const sectionHtml = sections
    .map(
      (_, index) => `
      <div class="pdf-section" ${index > 0 ? 'style="margin-top: 24px;"' : ''}>
        <div class="prose prose-lg max-w-none markdown-content">
          ${
            /* We'll render markdown to HTML inside the iframe using react-markdown is too heavy.
               Instead, we'll inject pre-rendered HTML from the DOM. */ ''
          }
          <div data-section-index="${index}"></div>
        </div>
      </div>
    `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — PDF Export</title>
  <style>${appStyles}</style>
  <style>
    /* ===== Print-optimized overrides ===== */
    @page {
      size: ${pageCSS};
      margin: 20mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: white !important;
      color: #1a1a1a !important;
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Force light theme for print */
    .dark { color-scheme: light; }

    .pdf-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 0;
    }

    /* TOC page break */
    .pdf-toc {
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e5e5;
      break-after: page;
    }

    .pdf-toc ol {
      color: #333;
    }

    /* Section styling */
    .pdf-section {
      break-inside: avoid-page;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: #111 !important;
      break-after: avoid;
      page-break-after: avoid;
    }

    h1 { font-size: 1.8em; margin-top: 0; margin-bottom: 0.5em; }
    h2 { font-size: 1.4em; margin-top: 1.5em; margin-bottom: 0.4em; }
    h3 { font-size: 1.2em; margin-top: 1.2em; margin-bottom: 0.3em; }

    /* Paragraphs */
    p {
      color: #1a1a1a !important;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
      orphans: 3;
      widows: 3;
    }

    /* Links */
    a {
      color: #1a5dab !important;
      text-decoration: underline;
    }

    /* Lists */
    ul, ol {
      color: #1a1a1a !important;
      padding-left: 24px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Code blocks */
    pre {
      background: #f5f5f5 !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 6px;
      padding: 12px 16px;
      overflow-x: auto;
      font-size: 0.85em;
      line-height: 1.5;
      break-inside: avoid;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    code {
      background: #f0f0f0 !important;
      color: #333 !important;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 0.9em;
      font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
    }

    pre code {
      background: transparent !important;
      padding: 0;
      border-radius: 0;
    }

    /* Inline code in CodeMirror displays */
    .cm-editor {
      background: #f5f5f5 !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 6px;
      overflow: hidden;
    }
    .cm-gutters {
      background: #ebebeb !important;
      border-right: 1px solid #ddd !important;
    }
    .cm-content {
      white-space: pre-wrap !important;
      word-wrap: break-word !important;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid #ccc !important;
      margin: 1em 0;
      padding: 8px 16px;
      color: #555 !important;
      background: #fafafa !important;
      break-inside: avoid;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 0.9em;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #ccc !important;
      padding: 8px 12px;
      text-align: left;
      color: #1a1a1a !important;
    }

    th {
      background: #f0f0f0 !important;
      font-weight: 600;
    }

    tr:nth-child(even) td {
      background: #fafafa !important;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Horizontal rules */
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2em 0;
    }

    /* Hide interactive elements */
    button, .no-print, [data-no-print] {
      display: none !important;
    }

    /* Task lists */
    input[type="checkbox"] {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Strong / emphasis */
    strong { color: #111 !important; }
    em { color: #333 !important; }

    /* Definition lists, details/summary */
    details { break-inside: avoid; }
    summary { font-weight: 600; }
  </style>
</head>
<body>
  <div class="pdf-container">
    ${includeMetadata && metadata ? buildMetadataBlock(metadata) : ''}
    ${includeTableOfContents ? buildTableOfContents(sections) : ''}
    ${sectionHtml}
  </div>
</body>
</html>`;
}
