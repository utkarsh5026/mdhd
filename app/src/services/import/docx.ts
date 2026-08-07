import { DOC_TITLE_CLASS, htmlToMarkdown } from './html';
import { ensureTitleHeading, normalizeMarkdown } from './markdown-cleanup';
import { DocumentConversionError } from './types';

/** Mammoth's module shape (it is CommonJS and uses `export =`). */
type MammothModule = typeof import('mammoth');

/**
 * Largest single embedded image inlined as a base64 data URI (2 MB of raw
 * bytes, ~2.7 MB once encoded). Larger images are replaced with a placeholder —
 * a scanned full-page graphic can easily be 10 MB on its own and would push the
 * converted document past what IndexedDB and the sync endpoint will accept.
 */
const MAX_INLINE_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Cumulative raw-byte budget for all inlined images in one document. Once
 * exhausted, remaining images become placeholders.
 */
const MAX_TOTAL_IMAGE_BYTES = 8 * 1024 * 1024;

/** Cap on distinct warnings reported back, so a broken file can't flood the UI. */
const MAX_WARNINGS = 10;

/**
 * Style mappings layered on top of mammoth's defaults.
 *
 * Mammoth already handles `Heading 1`–`Heading 6`, lists, tables, and links.
 * These fill the gaps that matter for real Word and Google Docs files —
 * most importantly `Title`, which is what Google Docs applies to a document's
 * heading and which mammoth would otherwise drop to a plain paragraph.
 */
const STYLE_MAP: string[] = [
  // Tagged so the HTML step can tell a document title from a section heading
  // and rebalance the levels beneath it.
  `p[style-name='Title'] => h1.${DOC_TITLE_CLASS}:fresh`,
  "p[style-name='Subtitle'] => p > em:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote:fresh",
  "p[style-name='Code'] => pre:separator('\\n')",
  "p[style-name='Source Code'] => pre:separator('\\n')",
  "r[style-name='Code Char'] => code",
  "r[style-name='Verbatim Char'] => code",
  'strike => del',
  'highlight => mark',
];

/**
 * Builds mammoth's image converter with a running byte budget.
 *
 * Images within budget become base64 data URIs, so an imported document renders
 * offline with no external requests and no server round-trip. Oversized images
 * yield an `<img>` with an empty `src`, which the HTML→markdown step turns into
 * a visible placeholder.
 *
 * @param mammoth - The loaded mammoth module.
 * @param warnings - Collector appended to when an image is skipped.
 */
function createImageConverter(mammoth: MammothModule, warnings: string[]) {
  let usedBytes = 0;
  let skipped = 0;

  return mammoth.images.imgElement(async (image) => {
    const buffer = await image.readAsArrayBuffer();
    const withinBudget =
      buffer.byteLength <= MAX_INLINE_IMAGE_BYTES &&
      usedBytes + buffer.byteLength <= MAX_TOTAL_IMAGE_BYTES;

    if (!withinBudget) {
      skipped++;
      if (skipped === 1) {
        warnings.push('Some images were too large to embed and were left out');
      }
      return { src: '' };
    }

    usedBytes += buffer.byteLength;
    const base64 = await image.readAsBase64String();
    return { src: `data:${image.contentType};base64,${base64}` };
  });
}

/**
 * Wraps a document's bytes in the input shape mammoth expects.
 *
 * mammoth ships two zip readers — a node one keyed on `path`/`buffer` and a
 * browser one keyed on `arrayBuffer` — and selects between them via
 * package.json's `browser` field. The app's Vite build gets the browser reader.
 * Vitest resolves mammoth's internal CommonJS `require` through Node and gets
 * the other one, and no Vite alias can intercept that. Both keys point at the
 * same bytes, so supplying both lets a single code path serve both.
 *
 * @param bytes - The raw `.docx` package.
 */
function mammothInput(bytes: ArrayBuffer): Parameters<MammothModule['convertToHtml']>[0] {
  return { arrayBuffer: bytes, buffer: bytes } as unknown as Parameters<
    MammothModule['convertToHtml']
  >[0];
}

/**
 * Loads mammoth on demand.
 *
 * Kept behind a dynamic import because mammoth (plus its jszip and xmldom
 * dependencies) is ~500 KB — far too large to sit in the entry bundle for a
 * feature most sessions never touch. Vite splits it into its own `doc-import`
 * chunk (see `manualChunks` in `vite.config.ts`).
 */
async function loadMammoth(): Promise<MammothModule> {
  const mod = await import('mammoth');
  // Bundlers surface a CommonJS `export =` on `.default`; some setups pass the
  // namespace through directly.
  return (mod as unknown as { default?: MammothModule }).default ?? mod;
}

/**
 * Converts a `.docx` file to markdown.
 *
 * Runs entirely in the browser: mammoth unzips the OOXML package and renders it
 * to semantic HTML, which is then turned into markdown. Nothing is uploaded, so
 * this works with no network and no signed-in user.
 *
 * Note this handles `.docx` only — the pre-2007 binary `.doc` format is a
 * different container that mammoth cannot read.
 *
 * @param file - The source `.docx` file.
 * @param title - Fallback H1 used when the document has no top-level heading.
 * @returns The markdown body and any non-fatal conversion warnings.
 * @throws {DocumentConversionError} When the file is not a readable `.docx`
 *   (corrupt, password-protected, or actually a legacy `.doc`).
 */
export async function docxToMarkdown(
  file: File,
  title: string
): Promise<{ markdown: string; warnings: string[] }> {
  const mammoth = await loadMammoth();
  const warnings: string[] = [];

  let html: string;
  try {
    const result = await mammoth.convertToHtml(mammothInput(await file.arrayBuffer()), {
      styleMap: STYLE_MAP,
      convertImage: createImageConverter(mammoth, warnings),
    });

    html = result.value;
    for (const message of result.messages) {
      if (warnings.length >= MAX_WARNINGS) break;
      if (!warnings.includes(message.message)) warnings.push(message.message);
    }
  } catch (error) {
    throw new DocumentConversionError(
      file.name,
      'Could not read this Word document — it may be corrupt, password-protected, or a legacy .doc file',
      error
    );
  }

  return {
    markdown: ensureTitleHeading(normalizeMarkdown(htmlToMarkdown(html)), title),
    warnings: warnings.slice(0, MAX_WARNINGS),
  };
}
