/**
 * Identifiers for the source document formats MDHD can turn into markdown.
 *
 * `markdown` is the pass-through case (`.md` / `.markdown`) — no conversion runs.
 * Everything else goes through a converter in this service before being stored.
 *
 * `code` covers source files (`.ts`, `.py`, `.rs`, …), which are wrapped in
 * fenced blocks rather than translated into prose — see `code.ts`.
 */
export type ImportFormat = 'markdown' | 'docx' | 'html' | 'code';

/**
 * The result of converting a source document into markdown.
 */
export interface ConvertedDocument {
  /**
   * The markdown body. Always ends with exactly one trailing newline and never
   * contains runs of more than two consecutive blank lines.
   */
  markdown: string;
  /**
   * Filename the document should be stored under, with the extension rewritten
   * to `.md` for converted formats (`Report.docx` → `Report.md`).
   */
  filename: string;
  /** Which converter produced this result. */
  format: ImportFormat;
  /**
   * Non-fatal problems encountered during conversion — an unmapped Word style,
   * an image skipped for exceeding the size cap. Surfaced to the user as a
   * single summary toast rather than one toast per message.
   */
  warnings: string[];
}

/**
 * Thrown when a document cannot be converted at all (corrupt archive, wrong
 * magic bytes, password-protected file).
 *
 * Carries the originating filename so upload batches can report which file
 * failed without threading it separately.
 */
export class DocumentConversionError extends Error {
  constructor(
    /** Name of the file that failed to convert. */
    readonly filename: string,
    /** Human-readable reason, safe to show in a toast. */
    message: string,
    /** The underlying error, when the failure came from a converter library. */
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DocumentConversionError';
  }
}
