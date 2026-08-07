import { describe, expect, it } from 'vitest';

import {
  detectFormat,
  getExtension,
  IMPORT_ACCEPT_ATTRIBUTE,
  isImportable,
  toMarkdownFilename,
} from './formats';

describe('getExtension', () => {
  it('returns the lower-cased extension with its dot', () => {
    expect(getExtension('Report.DOCX')).toBe('.docx');
  });

  it('uses only the final dot', () => {
    expect(getExtension('notes.backup.md')).toBe('.md');
  });

  it('returns empty string when there is no extension', () => {
    expect(getExtension('README')).toBe('');
  });

  it('treats a leading dot as a hidden file, not an extension', () => {
    expect(getExtension('.gitignore')).toBe('');
  });
});

describe('detectFormat', () => {
  it.each([
    ['notes.md', 'markdown'],
    ['notes.markdown', 'markdown'],
    ['Report.docx', 'docx'],
    ['Report.DOCX', 'docx'],
    ['page.html', 'html'],
    ['page.htm', 'html'],
  ])('maps %s to %s', (filename, expected) => {
    expect(detectFormat(filename)).toBe(expected);
  });

  it('rejects the legacy binary .doc format', () => {
    expect(detectFormat('Report.doc')).toBeNull();
  });

  it.each(['image.png', 'sheet.xlsx', 'archive.zip', 'README'])('rejects %s', (filename) => {
    expect(detectFormat(filename)).toBeNull();
  });
});

describe('isImportable', () => {
  it('accepts markdown and convertible formats', () => {
    expect(isImportable('a.md')).toBe(true);
    expect(isImportable('a.docx')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isImportable('a.pdf')).toBe(false);
  });
});

describe('toMarkdownFilename', () => {
  it('rewrites a converted extension to .md', () => {
    expect(toMarkdownFilename('Q3 Report.docx')).toBe('Q3 Report.md');
  });

  it('leaves .md untouched', () => {
    expect(toMarkdownFilename('notes.md')).toBe('notes.md');
  });

  it('normalizes .markdown to .md', () => {
    expect(toMarkdownFilename('notes.markdown')).toBe('notes.md');
  });

  it('appends .md when there is no extension', () => {
    expect(toMarkdownFilename('README')).toBe('README.md');
  });

  it('preserves dots inside the base name', () => {
    expect(toMarkdownFilename('v1.2.final.docx')).toBe('v1.2.final.md');
  });
});

describe('IMPORT_ACCEPT_ATTRIBUTE', () => {
  const extensions = IMPORT_ACCEPT_ATTRIBUTE.split(',');

  it('lists the document formats', () => {
    expect(extensions).toEqual(
      expect.arrayContaining(['.md', '.markdown', '.docx', '.html', '.htm'])
    );
  });

  it('lists only extensions that actually resolve to a format', () => {
    for (const extension of extensions) {
      expect(detectFormat(`file${extension}`)).not.toBeNull();
    }
  });

  it('has no duplicates', () => {
    expect(new Set(extensions).size).toBe(extensions.length);
  });
});
