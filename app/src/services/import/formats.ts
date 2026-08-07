import { CODE_EXTENSION_LIST, detectCodeLanguage } from './code-languages';
import type { ImportFormat } from './types';

/**
 * Maps a lower-cased file extension (including the dot) to the format that
 * handles it.
 *
 * `.docx` covers both Microsoft Word and Google Docs — Docs' "Download → Word"
 * export produces a standard OOXML `.docx`. Google Docs can also export
 * markdown directly, which lands in the `markdown` pass-through.
 *
 * Legacy `.doc` (the pre-2007 binary format) is deliberately absent: it is a
 * completely different container that mammoth cannot read. Word and Docs both
 * open it and can re-save as `.docx`.
 */
const EXTENSION_FORMATS: Readonly<Record<string, ImportFormat>> = {
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.docx': 'docx',
  '.html': 'html',
  '.htm': 'html',
};

/**
 * Value for the `accept` attribute of a file `<input>`, covering every format
 * this service can import.
 *
 * Source files are listed by extension rather than by MIME type — browsers
 * report most of them as `text/plain` or, for the ones they don't know,
 * an empty string.
 */
export const IMPORT_ACCEPT_ATTRIBUTE = [
  ...Object.keys(EXTENSION_FORMATS),
  ...CODE_EXTENSION_LIST,
].join(',');

/**
 * Extracts the lower-cased extension from a filename, including the leading dot.
 *
 * @param filename - A bare filename or full path.
 * @returns The extension (e.g. `.docx`), or an empty string when there is none.
 */
export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return '';
  return filename.slice(dot).toLowerCase();
}

/**
 * Resolves the import format for a filename.
 *
 * Prose formats win over source: `.html` is converted to markdown rather than
 * shown as HTML source, because that is what someone importing a saved web page
 * wants. To read markup as code, rename it (`page.html` → `page.xml`).
 *
 * @param filename - A bare filename or full path.
 * @returns The matching {@link ImportFormat}, or `null` when the extension is
 *   not one MDHD can read.
 */
export function detectFormat(filename: string): ImportFormat | null {
  const known = EXTENSION_FORMATS[getExtension(filename)];
  if (known) return known;

  return detectCodeLanguage(filename) === null ? null : 'code';
}

/**
 * Whether a file can be imported — i.e. it is markdown or a format with a
 * converter.
 *
 * @param filename - A bare filename or full path.
 */
export function isImportable(filename: string): boolean {
  return detectFormat(filename) !== null;
}

/**
 * Rewrites a filename's extension to `.md`, leaving markdown files untouched.
 *
 * Used so a converted `Q3 Report.docx` is stored — and later renamed, shared,
 * and synced — as `Q3 Report.md`.
 *
 * Source files keep their original extension and gain `.md` on top
 * (`main.rs` → `main.rs.md`): the language stays visible in the file tree, and
 * the `main.rs` / `main.py` of a mixed-language directory don't collide.
 *
 * @param filename - The source filename.
 * @returns The filename with a `.md` extension.
 */
export function toMarkdownFilename(filename: string): string {
  const ext = getExtension(filename);
  if (ext === '.md') return filename;
  if (!ext || detectFormat(filename) === 'code') return `${filename}.md`;
  return `${filename.slice(0, -ext.length)}.md`;
}
