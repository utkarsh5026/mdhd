import { describe, expect, it } from 'vitest';

import type { MarkdownSection } from '@/services/section/parsing';

import { extractSnippets, groupSnippets } from './snippets';

function makeSection(content: string, index = 0): MarkdownSection {
  return {
    id: `section-${index}`,
    title: `Section ${index}`,
    content,
    level: 1,
    wordCount: 0,
    startLine: 0,
    endLine: 0,
  };
}

describe('extractSnippets', () => {
  describe('code blocks', () => {
    it('extracts a fenced code block with language tag', () => {
      const sections = [makeSection('```js\nconsole.log("hi");\n```')];
      const snippets = extractSnippets(sections);

      expect(snippets).toHaveLength(1);
      expect(snippets[0].type).toBe('code');
      if (snippets[0].type === 'code') {
        expect(snippets[0].language).toBe('js');
        expect(snippets[0].code).toBe('console.log("hi");');
      }
    });

    it('extracts multiple code blocks from one section', () => {
      const content = '```python\nprint(1)\n```\nText.\n```rust\nfn main() {}\n```';
      const snippets = extractSnippets([makeSection(content)]);

      const codeSnippets = snippets.filter((s) => s.type === 'code');
      expect(codeSnippets).toHaveLength(2);
    });

    it('ignores code blocks without a language tag', () => {
      const sections = [makeSection('```\nno language\n```')];
      const snippets = extractSnippets(sections);

      expect(snippets.filter((s) => s.type === 'code')).toHaveLength(0);
    });

    it('trims trailing whitespace from code', () => {
      const sections = [makeSection('```ts\nconst x = 1;\n\n\n```')];
      const snippets = extractSnippets(sections);

      if (snippets[0].type === 'code') {
        expect(snippets[0].code).toBe('const x = 1;');
      }
    });
  });

  describe('images', () => {
    it('extracts markdown images', () => {
      const sections = [makeSection('![Photo](https://example.com/img.png)')];
      const snippets = extractSnippets(sections);

      expect(snippets).toHaveLength(1);
      expect(snippets[0].type).toBe('image');
      if (snippets[0].type === 'image') {
        expect(snippets[0].alt).toBe('Photo');
        expect(snippets[0].src).toBe('https://example.com/img.png');
      }
    });

    it('extracts image with empty alt text', () => {
      const sections = [makeSection('![](photo.jpg)')];
      const snippets = extractSnippets(sections);

      expect(snippets).toHaveLength(1);
      if (snippets[0].type === 'image') {
        expect(snippets[0].alt).toBe('');
      }
    });

    it('skips images inside code blocks', () => {
      const sections = [makeSection('```md\n![img](url.png)\n```')];
      const snippets = extractSnippets(sections);

      expect(snippets.filter((s) => s.type === 'image')).toHaveLength(0);
    });
  });

  describe('links', () => {
    it('extracts external http links', () => {
      const sections = [makeSection('[Google](https://google.com)')];
      const snippets = extractSnippets(sections);

      expect(snippets).toHaveLength(1);
      expect(snippets[0].type).toBe('link');
      if (snippets[0].type === 'link') {
        expect(snippets[0].text).toBe('Google');
        expect(snippets[0].url).toBe('https://google.com');
      }
    });

    it('ignores relative links (non-http)', () => {
      const sections = [makeSection('[local](./page.md)')];
      const snippets = extractSnippets(sections);

      expect(snippets.filter((s) => s.type === 'link')).toHaveLength(0);
    });

    it('does not extract image syntax as a link', () => {
      const sections = [makeSection('![alt](https://example.com/img.png)')];
      const snippets = extractSnippets(sections);

      expect(snippets.filter((s) => s.type === 'link')).toHaveLength(0);
    });

    it('skips links inside code blocks', () => {
      const sections = [makeSection('```md\n[link](https://example.com)\n```')];
      const snippets = extractSnippets(sections);

      expect(snippets.filter((s) => s.type === 'link')).toHaveLength(0);
    });

    it('extracts multiple links from one section', () => {
      const content = '[A](https://a.com) text [B](https://b.com)';
      const snippets = extractSnippets([makeSection(content)]);

      expect(snippets.filter((s) => s.type === 'link')).toHaveLength(2);
    });
  });

  describe('videos', () => {
    it('extracts <video src="..."> tags', () => {
      const sections = [makeSection('<video src="video.mp4"></video>')];
      const snippets = extractSnippets(sections);

      expect(snippets).toHaveLength(1);
      expect(snippets[0].type).toBe('video');
      if (snippets[0].type === 'video') {
        expect(snippets[0].src).toBe('video.mp4');
        expect(snippets[0].isEmbed).toBe(false);
      }
    });

    it('extracts <source src="..."> tags', () => {
      const sections = [makeSection('<video><source src="clip.webm"></video>')];
      const snippets = extractSnippets(sections);

      expect(snippets).toHaveLength(1);
      if (snippets[0].type === 'video') {
        expect(snippets[0].src).toBe('clip.webm');
        expect(snippets[0].isEmbed).toBe(false);
      }
    });

    it('extracts <iframe> as embedded video', () => {
      const sections = [makeSection('<iframe src="https://youtube.com/embed/abc"></iframe>')];
      const snippets = extractSnippets(sections);

      expect(snippets).toHaveLength(1);
      if (snippets[0].type === 'video') {
        expect(snippets[0].src).toBe('https://youtube.com/embed/abc');
        expect(snippets[0].isEmbed).toBe(true);
      }
    });

    it('skips video tags inside code blocks', () => {
      const sections = [makeSection('```html\n<video src="v.mp4"></video>\n```')];
      const snippets = extractSnippets(sections);

      expect(snippets.filter((s) => s.type === 'video')).toHaveLength(0);
    });
  });

  describe('cross-section extraction', () => {
    it('tracks sectionIndex and sectionTitle for each snippet', () => {
      const sections = [makeSection('[link](https://a.com)', 0), makeSection('![img](pic.png)', 1)];
      sections[0].title = 'First';
      sections[1].title = 'Second';

      const snippets = extractSnippets(sections);

      expect(snippets[0].sectionTitle).toBe('First');
      expect(snippets[0].sectionIndex).toBe(0);
      expect(snippets[1].sectionTitle).toBe('Second');
      expect(snippets[1].sectionIndex).toBe(1);
    });

    it('returns empty for sections with no snippets', () => {
      const sections = [makeSection('Just plain text, no code or links.')];
      expect(extractSnippets(sections)).toHaveLength(0);
    });

    it('generates unique ids per snippet', () => {
      const content = '```js\na\n```\n```js\nb\n```\n![img](x.png)\n[link](https://x.com)';
      const snippets = extractSnippets([makeSection(content)]);
      const ids = snippets.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});

describe('groupSnippets', () => {
  it('groups snippets by type', () => {
    const content =
      '```js\nx\n```\n![img](pic.png)\n[link](https://a.com)\n<video src="v.mp4"></video>';
    const snippets = extractSnippets([makeSection(content)]);
    const groups = groupSnippets(snippets);

    expect(groups.code).toHaveLength(1);
    expect(groups.image).toHaveLength(1);
    expect(groups.link).toHaveLength(1);
    expect(groups.video).toHaveLength(1);
  });

  it('returns empty arrays for missing types', () => {
    const groups = groupSnippets([]);
    expect(groups.code).toEqual([]);
    expect(groups.image).toEqual([]);
    expect(groups.video).toEqual([]);
    expect(groups.link).toEqual([]);
  });
});
