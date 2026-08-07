import { toast } from 'sonner';

import { detectCodeLanguage } from './code-languages';
import { detectFormat, getExtension, isImportable, toMarkdownFilename } from './formats';
import { type ConvertedDocument, DocumentConversionError } from './types';

/**
 * Derives a human-readable document title from a filename.
 *
 * Drops the extension and normalizes the separators export tools leave behind
 * (`Q3_Report-final.docx` → `Q3 Report final`).
 *
 * @param filename - The source filename.
 */
function titleFromFilename(filename: string): string {
  const ext = getExtension(filename);
  const base = ext ? filename.slice(0, -ext.length) : filename;
  return base.replace(/[_-]+/g, ' ').trim() || 'Untitled';
}

/**
 * Reads any supported document and returns it as markdown.
 *
 * Markdown files pass through untouched — same text, same filename — so this is
 * safe to call for every file in an upload batch. `.docx` (Word, and Google
 * Docs' "Download → Microsoft Word" export) and `.html` are converted in the
 * browser; the converters are dynamically imported so their ~500 KB of
 * dependencies only load when a user actually imports one. Source files are
 * wrapped in fenced blocks, one section per top-level construct.
 *
 * @param file - The file to read.
 * @returns The markdown body, the filename to store it under (extension
 *   rewritten to `.md` for converted formats), and any conversion warnings.
 * @throws {DocumentConversionError} When the format is unsupported or the file
 *   cannot be parsed.
 */
export async function convertToMarkdown(file: File): Promise<ConvertedDocument> {
  const format = detectFormat(file.name);

  if (format === null) {
    throw new DocumentConversionError(
      file.name,
      `Unsupported file type "${getExtension(file.name) || file.name}"`
    );
  }

  if (format === 'markdown') {
    return {
      markdown: await file.text(),
      filename: file.name,
      format,
      warnings: [],
    };
  }

  const filename = toMarkdownFilename(file.name);
  const title = titleFromFilename(file.name);

  if (format === 'code') {
    const { codeToMarkdown } = await import('./code');
    const language = detectCodeLanguage(file.name) ?? 'text';
    return {
      markdown: codeToMarkdown(await file.text(), file.name, language),
      filename,
      format,
      warnings: [],
    };
  }

  if (format === 'docx') {
    const { docxToMarkdown } = await import('./docx');
    const { markdown, warnings } = await docxToMarkdown(file, title);
    return { markdown, filename, format, warnings };
  }

  const [{ htmlToMarkdown }, { ensureTitleHeading, normalizeMarkdown }] = await Promise.all([
    import('./html'),
    import('./markdown-cleanup'),
  ]);

  try {
    const markdown = ensureTitleHeading(
      normalizeMarkdown(htmlToMarkdown(await file.text())),
      title
    );
    return { markdown, filename, format, warnings: [] };
  } catch (error) {
    throw new DocumentConversionError(file.name, 'Could not read this HTML document', error);
  }
}

/**
 * Converts the first importable file in a list, for the "open one document"
 * entry points (the welcome screen and the empty state) that read a file
 * straight into a tab without storing it.
 *
 * Unlike {@link convertToMarkdown} this never throws: a failed conversion is
 * reported to the user as a toast and resolves to `null`, because these call
 * sites are fire-and-forget drop handlers with nowhere to surface an error.
 *
 * @param files - Candidate files, typically the whole contents of a drop.
 * @returns The converted document, or `null` when the list held nothing
 *   readable, the document was empty, or conversion failed.
 */
export async function convertFirstDocument(files: File[]): Promise<ConvertedDocument | null> {
  const file = files.find(({ name }) => isImportable(name));
  if (!file) return null;

  try {
    const converted = await convertToMarkdown(file);
    if (!converted.markdown.trim()) return null;

    converted.warnings.forEach((warning) => toast.warning(warning));
    return converted;
  } catch (error) {
    if (error instanceof DocumentConversionError) {
      toast.error(`Couldn't open "${error.filename}"`, { description: error.message });
      return null;
    }
    throw error;
  }
}
