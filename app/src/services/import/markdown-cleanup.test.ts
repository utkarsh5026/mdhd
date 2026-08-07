import { describe, expect, it } from 'vitest';

import { ensureTitleHeading, normalizeMarkdown } from './markdown-cleanup';

describe('normalizeMarkdown', () => {
  it('collapses runs of blank lines to one', () => {
    expect(normalizeMarkdown('a\n\n\n\n\nb')).toBe('a\n\nb\n');
  });

  it('collapses blank lines that contain only whitespace', () => {
    expect(normalizeMarkdown('a\n\n   \n\t\nb')).toBe('a\n\nb\n');
  });

  it('keeps a single blank line between blocks', () => {
    expect(normalizeMarkdown('a\n\nb')).toBe('a\n\nb\n');
  });

  it('converts non-breaking spaces to regular spaces', () => {
    expect(normalizeMarkdown('Hello\u00a0world')).toBe('Hello world\n');
  });

  it('strips zero-width characters', () => {
    expect(normalizeMarkdown('He\u200bllo\ufeff')).toBe('Hello\n');
  });

  it('normalizes CRLF line endings', () => {
    expect(normalizeMarkdown('a\r\nb')).toBe('a\nb\n');
  });

  it('preserves the two trailing spaces of a markdown hard line break', () => {
    expect(normalizeMarkdown('line one  \nline two')).toBe('line one  \nline two\n');
  });

  it('ends with exactly one newline', () => {
    expect(normalizeMarkdown('a\n\n\n')).toBe('a\n');
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeMarkdown('  \n\n \t ')).toBe('');
  });
});

describe('ensureTitleHeading', () => {
  it('prepends an H1 when the document has none', () => {
    expect(ensureTitleHeading('Some body text.\n', 'Q3 Report')).toBe(
      '# Q3 Report\n\nSome body text.\n'
    );
  });

  it('leaves a document that already opens with an H1 alone', () => {
    const markdown = '# Real Title\n\nBody.\n';
    expect(ensureTitleHeading(markdown, 'Filename')).toBe(markdown);
  });

  it('leaves a document with an H1 further down alone', () => {
    const markdown = 'Intro paragraph.\n\n# Real Title\n';
    expect(ensureTitleHeading(markdown, 'Filename')).toBe(markdown);
  });

  it('still adds an H1 when the document only has deeper headings', () => {
    expect(ensureTitleHeading('## Subsection\n', 'Doc')).toBe('# Doc\n\n## Subsection\n');
  });

  it('does not mistake a hashtag in prose for a heading', () => {
    expect(ensureTitleHeading('Filed under #urgent today.\n', 'Doc')).toBe(
      '# Doc\n\nFiled under #urgent today.\n'
    );
  });

  it('produces a title-only document for empty content', () => {
    expect(ensureTitleHeading('', 'Doc')).toBe('# Doc\n');
  });
});
