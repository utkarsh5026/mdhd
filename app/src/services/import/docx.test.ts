import { readFileSync } from 'node:fs';

import { beforeAll, describe, expect, it } from 'vitest';

import { docxToMarkdown } from './docx';

/**
 * Loads a fixture as a `File`-like object.
 *
 * jsdom's `Blob` mangles binary payloads on the way back out, so the fixture's
 * bytes are handed over directly rather than through a real `File`. Only the
 * two members `docxToMarkdown` touches are provided.
 */
function fixture(name: string): File {
  const buf = readFileSync(`src/services/import/__fixtures__/${name}`);
  const bytes = new Uint8Array(buf);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  return { name, arrayBuffer: async () => arrayBuffer } as unknown as File;
}

describe('docxToMarkdown', () => {
  let markdown: string;
  let warnings: string[];

  beforeAll(async () => {
    ({ markdown, warnings } = await docxToMarkdown(
      fixture('quarterly-report.docx'),
      'Fallback Title'
    ));
  });

  it('converts cleanly, with nothing to report', () => {
    expect(warnings).toEqual([]);
  });

  it("promotes the Word 'Title' style to the document H1", () => {
    expect(markdown.startsWith('# Quarterly Report\n')).toBe(true);
  });

  it('does not fall back to the filename when the document has a title', () => {
    expect(markdown).not.toContain('Fallback Title');
  });

  it('demotes Heading 1 below the title so sections nest under it', () => {
    expect(markdown).toContain('## Overview');
    expect(markdown).toContain('### Details');
  });

  it("renders the 'Subtitle' style as emphasis", () => {
    expect(markdown).toContain('*Prepared for the board*');
  });

  it('preserves bold, italic, and strikethrough runs', () => {
    expect(markdown).toContain('**42%**');
    expect(markdown).toContain('*conservative*');
    expect(markdown).toContain('~~Down 3%~~');
  });

  it('converts the bulleted list', () => {
    expect(markdown).toMatch(/^-\s+First key result$/m);
    expect(markdown).toMatch(/^-\s+Second key result$/m);
  });

  it("converts the 'Quote' style to a blockquote", () => {
    expect(markdown).toContain('> Growth was broad-based across every region.');
  });

  it('converts a headerless Word table to a GFM table, not raw HTML', () => {
    expect(markdown).toContain('| Region | Revenue |');
    expect(markdown).toContain('| EMEA | 1.2M |');
    expect(markdown).not.toContain('<table');
  });

  it('preserves hyperlinks', () => {
    expect(markdown).toContain('[the full breakdown](https://example.com/q3)');
  });

  it('leaves no runs of blank lines', () => {
    expect(markdown).not.toMatch(/\n{3}/);
  });

  it('ends with exactly one newline', () => {
    expect(markdown.endsWith('\n')).toBe(true);
    expect(markdown.endsWith('\n\n')).toBe(false);
  });
});

describe('docxToMarkdown images', () => {
  let markdown: string;
  let warnings: string[];

  beforeAll(async () => {
    ({ markdown, warnings } = await docxToMarkdown(fixture('with-images.docx'), 'Scans'));
  });

  it('inlines an in-budget image as a base64 data URI', () => {
    expect(markdown).toMatch(/!\[Revenue chart]\(data:image\/png;base64,[A-Za-z0-9+/=]+\)/);
  });

  it('replaces an oversized image with a placeholder instead of embedding it', () => {
    expect(markdown).toContain('*[image omitted: Full page scan]*');
    expect(markdown).not.toContain('![Full page scan]');
  });

  it('reports the skipped image once', () => {
    expect(warnings).toEqual(['Some images were too large to embed and were left out']);
  });

  it('falls back to the supplied title when the document has no heading', () => {
    expect(markdown.startsWith('# Scans\n')).toBe(true);
  });
});

describe('docxToMarkdown failures', () => {
  it('rejects a file that is not a zip container at all', async () => {
    const notADocx = {
      name: 'legacy.docx',
      arrayBuffer: async () => new TextEncoder().encode('this is not OOXML').buffer,
    } as unknown as File;

    await expect(docxToMarkdown(notADocx, 'Legacy')).rejects.toThrow(
      /Could not read this Word document/
    );
  });

  it('carries the filename on the thrown error', async () => {
    const notADocx = {
      name: 'legacy.docx',
      arrayBuffer: async () => new TextEncoder().encode('nope').buffer,
    } as unknown as File;

    await expect(docxToMarkdown(notADocx, 'Legacy')).rejects.toMatchObject({
      name: 'DocumentConversionError',
      filename: 'legacy.docx',
    });
  });
});
