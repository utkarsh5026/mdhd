/**
 * Sub-section anchor extraction and resolution for cross-device resume.
 *
 * The anchor is the coordinate of a single rendered block within a section:
 *
 *   { heading_path, block_offset, block_tag, content_hash }
 *
 * `heading_path` is the list of slugified heading texts above the block (within
 * the section); `block_offset` is the index of the block among blocks with the
 * same heading path; `block_tag` is the HTML tag; `content_hash` is a short
 * fingerprint of the block's text. All four are derived purely from the
 * rendered DOM so the parser and renderer don't need to be touched.
 *
 * On resume, {@link findBlockByAnchor} walks the cascade — exact match first,
 * then progressively looser tiers — so a small edit to the document doesn't
 * cliff-fall back to "scroll to 40%."
 */

/** Tags we treat as top-level blocks within a section. */
const BLOCK_TAGS = new Set([
  'p',
  'ul',
  'ol',
  'pre',
  'blockquote',
  'table',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'figure',
  'img',
]);

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

const MAX_HASH_INPUT = 80;
const MAX_PATH_DEPTH = 8;
const MAX_SLUG_LEN = 80;

export interface BlockAnchor {
  heading_path: string[];
  block_offset: number;
  block_tag: string;
  content_hash: string | null;
}

/**
 * Slugify heading text to match the server-side path representation. Mirrors
 * the slugify in services/section/parsing.ts but kept local so the anchor
 * module has no upstream coupling.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LEN);
}

/**
 * djb2-style hash producing 8 lowercase hex chars (~32 bits). Cryptographic
 * strength isn't needed — collisions only have to be unlikely *within a single
 * section*, and the (path, offset, tag) tuple disambiguates anyway.
 */
function shortHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 8);
}

function normalizeForHash(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, MAX_HASH_INPUT);
}

/**
 * Hash a block's textual content to ~8 hex chars. Returns `null` for blocks
 * with no text (e.g. an empty `<hr>` or an image with no alt text) — the
 * cascade falls through to the (path, offset, tag) tier in that case.
 */
function hashBlock(block: Element): string | null {
  let text = (block.textContent || '').trim();
  if (!text && block.tagName.toLowerCase() === 'img') {
    text = block.getAttribute('alt') || block.getAttribute('src') || '';
  }
  if (!text) return null;
  return shortHash(normalizeForHash(text));
}

/** Top-level blocks of a section in document order. */
export function listBlocks(sectionRoot: Element): Element[] {
  const out: Element[] = [];
  const walker = document.createTreeWalker(sectionRoot, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (!BLOCK_TAGS.has(tag)) return NodeFilter.FILTER_SKIP;

      let parent = el.parentElement;
      while (parent && parent !== sectionRoot) {
        if (BLOCK_TAGS.has(parent.tagName.toLowerCase())) {
          return NodeFilter.FILTER_REJECT;
        }
        parent = parent.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node = walker.nextNode();
  while (node) {
    out.push(node as Element);
    node = walker.nextNode();
  }
  return out;
}

/**
 * For a list of blocks in source order, build the heading path and offset for
 * each. The path is the stack of recent headings shallower than the next one;
 * the offset is the index of the block among blocks sharing the same path.
 */
function computeAnchorsFor(blocks: Element[]): BlockAnchor[] {
  const stack: { level: number; slug: string }[] = [];
  const groupCounts = new Map<string, number>();
  const out: BlockAnchor[] = [];

  for (const block of blocks) {
    const tag = block.tagName.toLowerCase();
    if (HEADING_TAGS.has(tag)) {
      const level = parseInt(tag.slice(1), 10);
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const slug = slugify(block.textContent || '');
      if (slug && stack.length < MAX_PATH_DEPTH) {
        stack.push({ level, slug });
      }
    }

    const path = stack.map((s) => s.slug);
    const key = path.join('/');
    const offset = groupCounts.get(key) ?? 0;
    groupCounts.set(key, offset + 1);

    out.push({
      heading_path: path,
      block_offset: offset,
      block_tag: tag,
      content_hash: hashBlock(block),
    });
  }

  return out;
}

/** Anchor for a specific block. Returns null if the block isn't tracked. */
export function anchorForBlock(block: Element, sectionRoot: Element): BlockAnchor | null {
  const blocks = listBlocks(sectionRoot);
  const idx = blocks.indexOf(block);
  if (idx < 0) return null;
  return computeAnchorsFor(blocks)[idx];
}

/**
 * Compute anchors for every block in a section. Useful when an observer wants
 * to map DOM nodes back to anchors without recomputing the heading stack.
 */
export function listBlockAnchors(sectionRoot: Element): { block: Element; anchor: BlockAnchor }[] {
  const blocks = listBlocks(sectionRoot);
  const anchors = computeAnchorsFor(blocks);
  return blocks.map((block, i) => ({ block, anchor: anchors[i] }));
}

function pathEq(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Resolve an anchor against a freshly-rendered section, returning the matched
 * block element or `null` if even the loosest tier misses.
 *
 * Cascade (top wins):
 *   1. path + offset + tag + hash   — exact, doc unchanged
 *   2. path + offset + tag          — content edited, structure intact
 *   3. path + offset                — block type swapped (p → blockquote)
 *   4. hash anywhere in section     — block moved (insertion above)
 *   5. path only (first block)      — read block deleted, heading still there
 */
export function findBlockByAnchor(
  target: Pick<BlockAnchor, 'heading_path' | 'block_offset' | 'block_tag' | 'content_hash'>,
  sectionRoot: Element
): Element | null {
  const entries = listBlockAnchors(sectionRoot);
  if (entries.length === 0) return null;

  const samePath = entries.filter((e) => pathEq(e.anchor.heading_path, target.heading_path));

  // Tier 1
  for (const e of samePath) {
    if (
      e.anchor.block_offset === target.block_offset &&
      e.anchor.block_tag === target.block_tag &&
      target.content_hash !== null &&
      e.anchor.content_hash === target.content_hash
    ) {
      return e.block;
    }
  }
  // Tier 2
  for (const e of samePath) {
    if (e.anchor.block_offset === target.block_offset && e.anchor.block_tag === target.block_tag) {
      return e.block;
    }
  }
  // Tier 3
  for (const e of samePath) {
    if (e.anchor.block_offset === target.block_offset) return e.block;
  }
  // Tier 4 — search anywhere by hash
  if (target.content_hash) {
    const hashHit = entries.find((e) => e.anchor.content_hash === target.content_hash);
    if (hashHit) return hashHit.block;
  }
  // Tier 5 — first block under the same path (or section start when path is empty)
  if (samePath.length > 0) return samePath[0].block;
  return null;
}
