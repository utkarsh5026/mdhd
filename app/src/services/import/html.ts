import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Google Docs rewrites every outbound link through a redirector. The real
 * destination sits in the `q` query parameter.
 */
const GOOGLE_REDIRECT_PREFIX = 'https://www.google.com/url?';

/**
 * Elements that carry no reading content and would otherwise leak their text
 * (or a stray blank line) into the markdown.
 */
const STRIPPED_SELECTORS = ['style', 'script', 'meta', 'link', 'title'].join(',');

let cachedService: TurndownService | null = null;

/**
 * Builds (once) the shared Turndown instance.
 *
 * Options are chosen to match how MDHD's own markdown is written: ATX headings,
 * `-` bullets, fenced code, `*`/`**` emphasis. The GFM plugin supplies tables,
 * strikethrough, and task lists — all of which Word documents use heavily.
 */
function getService(): TurndownService {
  if (cachedService) return cachedService;

  const service = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });

  service.use(gfm);

  // turndown-plugin-gfm emits single-tilde `~text~`. That is valid GFM, but the
  // double-tilde form is what every other renderer and the in-app editor's
  // syntax highlighting expect.
  service.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content) => (content ? `~~${content}~~` : ''),
  });

  // Word emits <u> for underline. Markdown has no underline; keeping the tag
  // would survive into the output as raw HTML, so unwrap to plain text.
  service.addRule('underline', {
    filter: ['u'],
    replacement: (content) => content,
  });

  // Mammoth maps Word highlights to <mark>. Keep the text, drop the wrapper.
  service.addRule('highlight', {
    filter: ['mark'],
    replacement: (content) => content,
  });

  // An <img> with no src is what the DOCX converter emits for an image that
  // blew the inline-size budget. `![alt]()` would render as a broken image, so
  // leave a readable note in its place instead.
  service.addRule('srclessImage', {
    filter: (node) => node.nodeName === 'IMG' && !node.getAttribute('src'),
    replacement: (_content, node) => {
      const alt = (node as HTMLElement).getAttribute('alt')?.trim();
      return alt ? `*[image omitted: ${alt}]*` : '*[image omitted]*';
    },
  });

  cachedService = service;
  return service;
}

/**
 * Class the DOCX style map puts on the heading produced from a Word/Docs
 * `Title` paragraph, so heading levels can be rebalanced around it.
 */
export const DOC_TITLE_CLASS = 'mdhd-doc-title';

/**
 * Flattens block-level wrappers inside table cells.
 *
 * Word puts every cell's text in a `<w:p>`, so mammoth emits
 * `<td><p>text</p></td>`. turndown-plugin-gfm refuses to convert a table whose
 * cells contain block elements and falls back to emitting raw HTML, which
 * would leave a `<table>` blob in the middle of the markdown. Unwrapping the
 * paragraphs — joining multiples with `<br>` — lets the GFM table rule run.
 *
 * @param root - The container to search for table cells.
 */
function flattenTableCells(root: ParentNode): void {
  root.querySelectorAll('td, th').forEach((cell) => {
    const paragraphs = Array.from(cell.children).filter((child) => child.tagName === 'P');
    if (paragraphs.length === 0 || paragraphs.length !== cell.children.length) return;

    paragraphs.forEach((paragraph, index) => {
      if (index > 0) cell.insertBefore(cell.ownerDocument.createElement('br'), paragraph);
      paragraph.replaceWith(...Array.from(paragraph.childNodes));
    });
  });
}

/**
 * Promotes a table's first row to a header row when it doesn't have one.
 *
 * A GFM table must have a header; turndown-plugin-gfm keeps any table whose
 * first row isn't all `<th>` as raw HTML. Word only emits `<th>` when the author
 * ticked "Repeat as header row", which most documents never do — so without
 * this, most imported tables would arrive as an unreadable block of HTML.
 * Treating row one as the header is what the table almost always means.
 *
 * @param root - The container to search for tables.
 */
function ensureTableHeader(root: ParentNode): void {
  root.querySelectorAll('table').forEach((table) => {
    const firstRow = table.querySelector('tr');
    const cells = firstRow ? Array.from(firstRow.children) : [];
    if (cells.length === 0 || cells.every((cell) => cell.tagName === 'TH')) return;

    for (const cell of cells) {
      const header = cell.ownerDocument.createElement('th');
      header.append(...Array.from(cell.childNodes));
      cell.replaceWith(header);
    }
  });
}

/**
 * Demotes section headings that sit under a document title.
 *
 * Word and Google Docs treat `Title` and `Heading 1` as separate styles, and a
 * document that uses both means the title to contain the `Heading 1` sections.
 * Converted literally, both land at `#`, which makes the title a sibling of its
 * own sections — in MDHD that shows up as an empty first reading section.
 *
 * Only runs when a title heading is actually present, so a plain Word document
 * that uses `Heading 1` as its top level keeps its levels untouched. `h6` is the
 * floor and stays put.
 *
 * @param root - The container to rebalance.
 */
function demoteHeadingsBelowTitle(root: ParentNode): void {
  const title = root.querySelector(`h1.${DOC_TITLE_CLASS}`);
  if (!title) return;

  const others = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5')).filter(
    (heading) => heading !== title
  );
  if (!others.some((heading) => heading.tagName === 'H1')) return;

  for (const heading of others) {
    const demoted = heading.ownerDocument.createElement(`h${Number(heading.tagName[1]) + 1}`);
    demoted.append(...Array.from(heading.childNodes));
    heading.replaceWith(demoted);
  }
}

/**
 * Resolves a Google Docs redirector URL to the destination it points at.
 *
 * @param href - The raw `href` value.
 * @returns The unwrapped URL, or `href` unchanged when it is not a redirect.
 */
function unwrapGoogleRedirect(href: string): string {
  if (!href.startsWith(GOOGLE_REDIRECT_PREFIX)) return href;

  try {
    return new URL(href).searchParams.get('q') ?? href;
  } catch {
    return href;
  }
}

/**
 * Strips the structural noise Word and Google Docs bake into exported HTML.
 *
 * Runs against a detached document so the caller's markup is never mutated:
 *
 * - `<style>`/`<script>`/`<meta>` blocks, whose text would otherwise be emitted
 * - empty bookmark anchors (`<a id="h.abc123"></a>`), which Docs inserts before
 *   every heading and which Turndown renders as stray `[]()` links
 * - Google's link redirector, unwrapped back to the real destination
 * - block wrappers inside table cells, and heading levels under a document
 *   title (see {@link flattenTableCells} and {@link demoteHeadingsBelowTitle})
 *
 * @param html - Raw HTML from a converter or an exported `.html` file.
 * @returns The cleaned `<body>` element, ready to hand to Turndown.
 */
function cleanDocument(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll(STRIPPED_SELECTORS).forEach((node) => node.remove());

  doc.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href');

    if (!href) {
      // A bookmark target, not a link. Unwrap so its (usually empty) text
      // survives without the surrounding link syntax.
      anchor.replaceWith(...Array.from(anchor.childNodes));
      return;
    }

    anchor.setAttribute('href', unwrapGoogleRedirect(href));
  });

  flattenTableCells(doc.body);
  ensureTableHeader(doc.body);
  demoteHeadingsBelowTitle(doc.body);

  return doc.body;
}

/**
 * Converts an HTML fragment or full document to markdown.
 *
 * Shared by both import paths: the DOCX converter renders to HTML via mammoth
 * and hands the result here, and `.html` files go straight in.
 *
 * @param html - The HTML source.
 * @returns Markdown, not yet normalized — callers run it through
 *   `normalizeMarkdown` from `./markdown-cleanup`.
 */
export function htmlToMarkdown(html: string): string {
  return getService().turndown(cleanDocument(html));
}
