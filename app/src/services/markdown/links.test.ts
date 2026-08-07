import { describe, expect, it } from 'vitest';

import { isDocumentLink, resolveDocumentLink } from './links';

describe('isDocumentLink', () => {
  it.each(['./setup.md', '../reference/api.md', 'setup.md', '/docs/setup.md', 'my%20doc.md'])(
    'treats %s as a document link',
    (href) => {
      expect(isDocumentLink(href)).toBe(true);
    }
  );

  it.each([
    'https://example.com/x.md',
    'http://example.com',
    'mailto:someone@example.com',
    '//cdn.example.com/x.md',
    '#in-page-anchor',
    '',
    undefined,
  ])('does not treat %s as a document link', (href) => {
    expect(isDocumentLink(href)).toBe(false);
  });
});

describe('resolveDocumentLink', () => {
  const from = '/docs/guide/setup.md';

  it('resolves a sibling link', () => {
    expect(resolveDocumentLink('./install.md', from)).toEqual({
      candidates: ['/docs/guide/install.md'],
      hash: undefined,
    });
  });

  it('resolves a link with no leading ./', () => {
    expect(resolveDocumentLink('install.md', from)?.candidates).toEqual(['/docs/guide/install.md']);
  });

  it('walks up with ..', () => {
    expect(resolveDocumentLink('../reference/api.md', from)?.candidates).toEqual([
      '/docs/reference/api.md',
    ]);
  });

  it('clamps traversal above the root', () => {
    expect(resolveDocumentLink('../../../../x.md', from)?.candidates).toEqual(['/x.md']);
  });

  it('keeps root-absolute paths as written', () => {
    expect(resolveDocumentLink('/docs/other.md', from)?.candidates).toEqual(['/docs/other.md']);
  });

  it('extracts the fragment', () => {
    expect(resolveDocumentLink('../api.md#usage-notes', from)).toEqual({
      candidates: ['/docs/api.md'],
      hash: 'usage-notes',
    });
  });

  it('drops a query string but keeps the fragment', () => {
    expect(resolveDocumentLink('./a.md?v=2#top', from)).toEqual({
      candidates: ['/docs/guide/a.md'],
      hash: 'top',
    });
  });

  it('decodes percent-escaped filenames', () => {
    expect(resolveDocumentLink('./my%20doc.md', from)?.candidates).toEqual([
      '/docs/guide/my doc.md',
    ]);
  });

  it('offers a .md fallback for source files rewritten on upload', () => {
    expect(resolveDocumentLink('./main.rs', from)?.candidates).toEqual([
      '/docs/guide/main.rs',
      '/docs/guide/main.rs.md',
    ]);
  });

  it('offers a .md fallback for extensionless links', () => {
    expect(resolveDocumentLink('../install', from)?.candidates).toEqual([
      '/docs/install',
      '/docs/install.md',
    ]);
  });

  it('resolves against the root when the document has no path', () => {
    expect(resolveDocumentLink('./notes.md', undefined)?.candidates).toEqual(['/notes.md']);
  });

  it('returns null for external and in-page links', () => {
    expect(resolveDocumentLink('https://example.com/a.md', from)).toBeNull();
    expect(resolveDocumentLink('#heading', from)).toBeNull();
  });
});
