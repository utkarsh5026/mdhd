/**
 * Resolution of links that point at other documents in the local file tree.
 *
 * Markdown written for a docs folder navigates with relative paths
 * (`[setup](./setup.md)`, `[api](../reference/api.md)`). Those are meaningless
 * to the browser inside a single-page app, so they are resolved here against
 * the containing document's path and handed to the tab opener instead.
 */

/** Extensions a link may omit or that uploads rewrite; see `services/import/formats.ts`. */
const DOCUMENT_EXTENSIONS = ['.md', '.markdown', '.mdx', '.txt'];

/** Matches an absolute URL scheme (`https:`, `mailto:`) or a protocol-relative `//host`. */
const ABSOLUTE_URL = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * A link that may point at another document in the file tree.
 */
export interface ResolvedDocumentLink {
  /**
   * Absolute paths to try, in order. Uploads normalize every document to a
   * `.md` extension (`main.rs` is stored as `main.rs.md`), and docs commonly
   * link without an extension at all, so one href can map to several
   * plausible records.
   */
  candidates: string[];
  /** Heading slug taken from the link's fragment, without the leading `#`. */
  hash?: string;
}

/**
 * Returns the directory portion of an absolute file path.
 *
 * @param path - Absolute path such as `/docs/guide/setup.md`.
 * @returns The parent directory (`/docs/guide`), or `/` at the root.
 */
function dirname(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return path.slice(0, lastSlash);
}

/**
 * Collapses `.` and `..` segments into a canonical absolute path.
 *
 * Traversal above the root is clamped rather than rejected — `../../x.md` from
 * `/a.md` yields `/x.md`, matching how the file tree presents a flat root.
 */
function normalize(path: string): string {
  const segments: string[] = [];

  for (const segment of path.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return '/' + segments.join('/');
}

/**
 * Decodes percent-escapes in a path, tolerating malformed input.
 *
 * Filenames with spaces are written as `my%20doc.md` but stored unescaped, so
 * lookups have to happen on the decoded form.
 */
function decodePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * Decides whether an href should be treated as a link to another local
 * document rather than something the browser should handle itself.
 *
 * External URLs, `mailto:`, and bare fragments (`#section`, which the reader
 * resolves in-page against rehype-slug anchors) are all excluded.
 *
 * @param href - The raw href as written in the markdown source.
 */
export function isDocumentLink(href: string | undefined): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) return false;
  return !ABSOLUTE_URL.test(trimmed);
}

/**
 * Resolves a relative or root-absolute markdown link into candidate file paths.
 *
 * @param href - Link target as written in the source, e.g. `../api.md#usage`.
 * @param fromPath - Absolute path of the document containing the link. When
 *   omitted the link is resolved against the tree root, which is the best
 *   guess available for tabs that were pasted rather than opened from a file.
 * @returns Candidate paths plus any fragment, or `null` if `href` is not a
 *   local document link.
 *
 * @example
 * resolveDocumentLink('../api.md#usage', '/docs/guide/setup.md')
 * // => { candidates: ['/docs/api.md'], hash: 'usage' }
 */
export function resolveDocumentLink(
  href: string | undefined,
  fromPath?: string
): ResolvedDocumentLink | null {
  if (!href || !isDocumentLink(href)) return null;

  // Strip the fragment and any query string before touching the path.
  const [pathAndQuery, ...fragmentParts] = href.trim().split('#');
  const hash = fragmentParts.join('#') || undefined;
  const rawPath = pathAndQuery.split('?')[0];
  if (!rawPath) return null;

  const target = decodePath(rawPath);
  const base = target.startsWith('/') ? '' : dirname(fromPath ?? '/');
  const resolved = normalize(`${base}/${target}`);

  const lower = resolved.toLowerCase();
  const hasDocumentExtension = DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext));

  // `main.rs` is stored as `main.rs.md`, and extensionless docs links are
  // conventional on GitHub — so always offer the `.md` form as a fallback.
  const candidates = hasDocumentExtension ? [resolved] : [resolved, `${resolved}.md`];

  return { candidates, hash: hash ? decodePath(hash) : undefined };
}
