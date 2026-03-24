import type { MarkdownSection } from '@/services/section/parsing';

export type SnippetType = 'code' | 'image' | 'video' | 'link';

export interface BaseSnippet {
  id: string;
  type: SnippetType;
  sectionTitle: string;
  sectionIndex: number;
}

export interface CodeSnippet extends BaseSnippet {
  type: 'code';
  language: string;
  code: string;
}

export interface ImageSnippet extends BaseSnippet {
  type: 'image';
  src: string;
  alt: string;
}

export interface VideoSnippet extends BaseSnippet {
  type: 'video';
  src: string;
  /** true = iframe embed (YouTube, Vimeo, etc.), false = native <video> */
  isEmbed: boolean;
}

export interface LinkSnippet extends BaseSnippet {
  type: 'link';
  url: string;
  text: string;
}

export type Snippet = CodeSnippet | ImageSnippet | VideoSnippet | LinkSnippet;

export interface SnippetGroups {
  code: CodeSnippet[];
  image: ImageSnippet[];
  video: VideoSnippet[];
  link: LinkSnippet[];
}

/**
 * Returns the [start, end) byte ranges of every fenced code block in `text`,
 * so other regexes can skip matches that fall inside them.
 */
function findCodeBlockRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /```[\s\S]*?```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function isInCodeBlock(pos: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([start, end]) => pos >= start && pos < end);
}

/**
 * Extracts code, image, video, and external link snippets from a list of
 * markdown sections.  Snippets retain which section they came from so the
 * reader can navigate back to it.
 */
export function extractSnippets(sections: MarkdownSection[]): Snippet[] {
  const snippets: Snippet[] = [];

  sections.forEach((section, sectionIndex) => {
    const { content, title: sectionTitle } = section;
    const base = { sectionTitle, sectionIndex };

    const codeRanges = findCodeBlockRanges(content);

    // ── Code blocks (language tag required) ─────────────────────────────────
    const codeRe = /```(\w+)\n([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = codeRe.exec(content)) !== null) {
      snippets.push({
        ...base,
        id: `code-${sectionIndex}-${m.index}`,
        type: 'code',
        language: m[1],
        code: m[2].trimEnd(),
      });
    }

    // ── Images ───────────────────────────────────────────────────────────────
    // Track image positions so the link pass can skip them.
    const imagePositions = new Set<number>();
    const imageRe = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
    while ((m = imageRe.exec(content)) !== null) {
      if (isInCodeBlock(m.index, codeRanges)) continue;
      imagePositions.add(m.index);
      snippets.push({
        ...base,
        id: `image-${sectionIndex}-${m.index}`,
        type: 'image',
        alt: m[1],
        src: m[2],
      });
    }

    // ── External links (http/https only, not images) ─────────────────────────
    const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    while ((m = linkRe.exec(content)) !== null) {
      if (isInCodeBlock(m.index, codeRanges)) continue;
      // skip if preceded by '!' (image syntax)
      if (m.index > 0 && content[m.index - 1] === '!') continue;
      snippets.push({
        ...base,
        id: `link-${sectionIndex}-${m.index}`,
        type: 'link',
        text: m[1],
        url: m[2],
      });
    }

    // ── <video src="..."> tags ───────────────────────────────────────────────
    const videoTagRe = /<video[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    while ((m = videoTagRe.exec(content)) !== null) {
      if (isInCodeBlock(m.index, codeRanges)) continue;
      snippets.push({
        ...base,
        id: `video-${sectionIndex}-${m.index}`,
        type: 'video',
        src: m[1],
        isEmbed: false,
      });
    }

    // ── <source src="..."> inside <video> ────────────────────────────────────
    const sourceTagRe = /<source[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    while ((m = sourceTagRe.exec(content)) !== null) {
      if (isInCodeBlock(m.index, codeRanges)) continue;
      snippets.push({
        ...base,
        id: `vsource-${sectionIndex}-${m.index}`,
        type: 'video',
        src: m[1],
        isEmbed: false,
      });
    }

    // ── <iframe src="..."> embeds ────────────────────────────────────────────
    const iframeRe = /<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    while ((m = iframeRe.exec(content)) !== null) {
      if (isInCodeBlock(m.index, codeRanges)) continue;
      snippets.push({
        ...base,
        id: `embed-${sectionIndex}-${m.index}`,
        type: 'video',
        src: m[1],
        isEmbed: true,
      });
    }
  });

  return snippets;
}

export function groupSnippets(snippets: Snippet[]): SnippetGroups {
  return {
    code: snippets.filter((s): s is CodeSnippet => s.type === 'code'),
    image: snippets.filter((s): s is ImageSnippet => s.type === 'image'),
    video: snippets.filter((s): s is VideoSnippet => s.type === 'video'),
    link: snippets.filter((s): s is LinkSnippet => s.type === 'link'),
  };
}
