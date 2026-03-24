import { describe, expect, it } from 'vitest';

import { countWords, estimateReadingTime, parseMarkdownIntoSections, slugify } from './parsing';

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Getting Started')).toBe('getting-started');
  });

  it('strips non-word characters except hyphens', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('API v2 — Overview')).toBe('api-v2-overview');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles string with only special chars', () => {
    expect(slugify('!@#$%')).toBe('');
  });

  it('preserves numbers', () => {
    expect(slugify('Chapter 3 Setup')).toBe('chapter-3-setup');
  });
});

describe('countWords', () => {
  it('counts plain words', () => {
    expect(countWords('hello world foo')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('strips markdown bold/italic before counting', () => {
    expect(countWords('**bold** and *italic* text')).toBe(4);
  });

  it('strips inline code before counting', () => {
    expect(countWords('use `console.log` here')).toBe(2);
  });

  it('strips code blocks before counting', () => {
    const md = 'before\n```js\nconst x = 1;\n```\nafter';
    expect(countWords(md)).toBe(2);
  });

  it('strips headings syntax but keeps words', () => {
    expect(countWords('## My Heading')).toBe(2);
  });

  it('strips links but keeps link text', () => {
    expect(countWords('[click here](https://example.com)')).toBe(2);
  });

  it('strips images but alt text words may remain', () => {
    // The image regex removes the full ![alt](url) syntax
    // but "alt text" words leak through since the regex only strips the markdown syntax
    expect(countWords('![alt text](img.png) hello')).toBe(3);
  });

  it('strips HTML tags', () => {
    expect(countWords('<div>hello world</div>')).toBe(2);
  });
});

describe('estimateReadingTime', () => {
  it('returns minimum 1 minute in ms for very short text', () => {
    expect(estimateReadingTime(1)).toBe(60_000);
  });

  it('calculates correctly for 250 words at default speed', () => {
    expect(estimateReadingTime(250)).toBe(60_000);
  });

  it('calculates correctly for 500 words at default speed', () => {
    expect(estimateReadingTime(500)).toBe(120_000);
  });

  it('respects custom reading speed', () => {
    // 500 words at 500 wpm = 1 minute
    expect(estimateReadingTime(500, 500)).toBe(60_000);
  });
});

describe('parseMarkdownIntoSections', () => {
  it('parses a single heading into one section', () => {
    const md = '# Hello\nSome content here.';
    const { sections, metadata } = parseMarkdownIntoSections(md);

    expect(metadata).toBeNull();
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Hello');
    expect(sections[0].level).toBe(1);
    expect(sections[0].id).toBe('hello');
    expect(sections[0].content).toContain('Some content here.');
  });

  it('creates an Introduction section for content before first heading', () => {
    const md = 'Some intro text.\n\n# First Section\nContent.';
    const { sections } = parseMarkdownIntoSections(md);

    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Introduction');
    expect(sections[0].id).toBe('introduction');
    expect(sections[0].level).toBe(0);
    expect(sections[0].content).toContain('Some intro text.');
  });

  it('splits multiple headings into separate sections', () => {
    const md = '# First\nContent 1\n## Second\nContent 2\n### Third\nContent 3';
    const { sections } = parseMarkdownIntoSections(md);

    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe('First');
    expect(sections[0].level).toBe(1);
    expect(sections[1].title).toBe('Second');
    expect(sections[1].level).toBe(2);
    expect(sections[2].title).toBe('Third');
    expect(sections[2].level).toBe(3);
  });

  it('only splits on H1–H3, treats H4+ as content', () => {
    const md = '# Main\n#### Sub detail\nMore text.';
    const { sections } = parseMarkdownIntoSections(md);

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Main');
    expect(sections[0].content).toContain('#### Sub detail');
  });

  it('handles empty document', () => {
    const { sections, metadata } = parseMarkdownIntoSections('');
    expect(sections).toHaveLength(0);
    expect(metadata).toBeNull();
  });

  it('handles document with only whitespace', () => {
    const { sections } = parseMarkdownIntoSections('   \n  \n   ');
    expect(sections).toHaveLength(0);
  });

  describe('frontmatter', () => {
    it('extracts YAML frontmatter as metadata', () => {
      const md = '---\ntitle: My Doc\nauthor: Jane\n---\n# Heading\nText.';
      const { metadata, sections } = parseMarkdownIntoSections(md);

      expect(metadata).toEqual({ title: 'My Doc', author: 'Jane' });
      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Heading');
    });

    it('returns null metadata when frontmatter is empty YAML', () => {
      const md = '---\n---\n# Heading\nText.';
      const { metadata } = parseMarkdownIntoSections(md);
      expect(metadata).toBeNull();
    });

    it('returns null metadata when no frontmatter exists', () => {
      const md = '# Heading\nText.';
      const { metadata } = parseMarkdownIntoSections(md);
      expect(metadata).toBeNull();
    });

    it('treats invalid YAML gracefully', () => {
      const md = '---\n: invalid: yaml: [\n---\n# Heading\nText.';
      const { metadata, sections } = parseMarkdownIntoSections(md);
      // Should not crash; metadata may be null or parsed depending on yaml lib
      expect(sections.length).toBeGreaterThanOrEqual(1);
      expect(metadata === null || typeof metadata === 'object').toBe(true);
    });

    it('adjusts line numbers when frontmatter is present', () => {
      const md = '---\ntitle: Test\n---\n# Heading\nContent here.';
      const { sections } = parseMarkdownIntoSections(md);

      // Frontmatter is 3 lines (---, title: Test, ---), so heading starts at line 3
      expect(sections[0].startLine).toBe(3);
    });
  });

  describe('code blocks', () => {
    it('does not split on headings inside code blocks', () => {
      const md = '# Real Heading\n```\n# Not A Heading\n## Also Not\n```\nMore text.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Real Heading');
      expect(sections[0].content).toContain('# Not A Heading');
      expect(sections[0].content).toContain('## Also Not');
    });

    it('handles code blocks in intro content', () => {
      const md = 'Intro text.\n```python\n# comment\nprint("hi")\n```\n# Heading\nAfter.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].content).toContain('# comment');
      expect(sections[1].title).toBe('Heading');
    });

    it('handles code blocks with language specifier', () => {
      const md = '# Section\n```typescript\nconst x: number = 1;\n```\nAfter code.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].content).toContain('```typescript');
      expect(sections[0].content).toContain('const x: number = 1;');
    });

    it('handles unclosed code block (rest of doc is code)', () => {
      const md = '# Before\nText.\n```\n# Inside code\nMore code.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].content).toContain('# Inside code');
    });

    it('handles multiple code blocks in one section', () => {
      const md = '# Section\n```\ncode1\n```\nMiddle text.\n```\ncode2\n```\nEnd text.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].content).toContain('code1');
      expect(sections[0].content).toContain('code2');
      expect(sections[0].content).toContain('Middle text.');
    });
  });

  describe('slug deduplication', () => {
    it('appends numeric suffix for duplicate heading titles', () => {
      const md = '# Setup\nFirst.\n# Setup\nSecond.\n# Setup\nThird.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(3);
      expect(sections[0].id).toBe('setup');
      expect(sections[1].id).toBe('setup-1');
      expect(sections[2].id).toBe('setup-2');
    });

    it('deduplicates slugs that normalize to the same value', () => {
      const md = '# Hello World\nA.\n# hello world\nB.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections[0].id).toBe('hello-world');
      expect(sections[1].id).toBe('hello-world-1');
    });
  });

  describe('word counts', () => {
    it('computes word count for each section', () => {
      const md = '# Short\nOne two three.\n# Longer\nFour five six seven eight.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections[0].wordCount).toBeGreaterThan(0);
      expect(sections[1].wordCount).toBeGreaterThan(sections[0].wordCount);
    });

    it('includes heading words in word count', () => {
      const md = '# Two Words';
      const { sections } = parseMarkdownIntoSections(md);
      // "Two Words" heading is in content as "# Two Words\n"
      expect(sections[0].wordCount).toBe(2);
    });
  });

  describe('line tracking', () => {
    it('tracks startLine and endLine for sections', () => {
      const md = '# First\nLine 1.\n# Second\nLine 2.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections[0].startLine).toBe(0);
      expect(sections[0].endLine).toBe(2); // ends where next section starts
      expect(sections[1].startLine).toBe(2);
      expect(sections[1].endLine).toBe(4); // total lines
    });

    it('tracks lines correctly with intro section', () => {
      const md = 'Intro line.\n# Heading\nContent.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].startLine).toBe(0);
      expect(sections[1].title).toBe('Heading');
      expect(sections[1].startLine).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('handles heading with no content after it', () => {
      const md = '# Empty Section';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Empty Section');
    });

    it('handles consecutive headings with no content between', () => {
      const md = '# First\n## Second\n### Third';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(3);
      expect(sections[0].title).toBe('First');
      expect(sections[1].title).toBe('Second');
      expect(sections[2].title).toBe('Third');
    });

    it('handles heading with extra spaces in prefix', () => {
      // "# " is valid, but " # " (leading space) is NOT a heading in CommonMark
      const md = '# Valid Heading\n # Not a heading';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].content).toContain('# Not a heading');
    });

    it('handles Windows-style line endings (CRLF)', () => {
      const md = '# Heading\r\nContent line 1.\r\nContent line 2.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Heading');
      expect(sections[0].content).toContain('Content line 1.');
    });

    it('handles document that is only intro content (no headings)', () => {
      const md = 'Just some text.\nAnother line.\nMore text.';
      const { sections } = parseMarkdownIntoSections(md);

      expect(sections).toHaveLength(1);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].id).toBe('introduction');
    });

    it('handles heading-like lines that are not headings (no space after #)', () => {
      const md = '#hashtag is not a heading\n# Real Heading\nContent.';
      const { sections } = parseMarkdownIntoSections(md);

      // "#hashtag" has no space after # so should not be parsed as heading
      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].content).toContain('#hashtag');
      expect(sections[1].title).toBe('Real Heading');
    });

    it('handles very long documents', () => {
      const lines = ['# Start'];
      for (let i = 0; i < 10_000; i++) {
        lines.push(`Line ${i} of content with some words here.`);
      }
      lines.push('# End');
      lines.push('Final content.');

      const { sections } = parseMarkdownIntoSections(lines.join('\n'));

      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Start');
      expect(sections[1].title).toBe('End');
      expect(sections[0].wordCount).toBeGreaterThan(1000);
    });

    it('handles frontmatter followed by intro content then headings', () => {
      const md = '---\ntitle: Test\n---\nIntro paragraph.\n\n# Section One\nContent.';
      const { sections, metadata } = parseMarkdownIntoSections(md);

      expect(metadata).toEqual({ title: 'Test' });
      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[1].title).toBe('Section One');
    });
  });
});
