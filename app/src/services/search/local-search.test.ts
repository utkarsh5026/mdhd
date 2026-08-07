import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';

import { fileStorageDB } from '@/services/indexeddb';
import type { CreateFileInput } from '@/services/indexeddb/types';

import { invalidateLocalSearchIndex, listLocalFiles, searchLocalFiles } from './local-search';

function makeFile(overrides: Partial<CreateFileInput> = {}): CreateFileInput {
  const content = overrides.content ?? '# Hello';
  return {
    name: 'readme.md',
    path: '/readme.md',
    parentPath: '/',
    size: content.length,
    ...overrides,
    content,
  };
}

/** `addFile` returns null on a path collision, which never happens in these tests. */
async function addFile(overrides: Partial<CreateFileInput> = {}) {
  const file = await fileStorageDB.addFile(makeFile(overrides));
  if (!file) throw new Error('fixture file was not created');
  return file;
}

beforeEach(async () => {
  await fileStorageDB.clearAll();
  invalidateLocalSearchIndex();
});

describe('searchLocalFiles', () => {
  it('finds a match in prose', async () => {
    await addFile({ content: '# Guide\n\nConfigure the server.' });

    const hits = await searchLocalFiles('configure');

    expect(hits).toHaveLength(1);
    expect(hits[0].fileName).toBe('readme.md');
    expect(hits[0].snippet.toLowerCase()).toContain('configure');
  });

  it('finds identifiers inside fenced code blocks', async () => {
    await addFile({ content: '# API\n\n```ts\nexport function parseConfig() {}\n```' });

    const hits = await searchLocalFiles('parseConfig');

    expect(hits).toHaveLength(1);
    expect(hits[0].snippet).toContain('parseConfig');
  });

  it('is case-insensitive', async () => {
    await addFile({ content: 'The Widget Factory' });

    expect(await searchLocalFiles('widget')).toHaveLength(1);
    expect(await searchLocalFiles('WIDGET')).toHaveLength(1);
  });

  it('counts every occurrence but returns one hit per document', async () => {
    await addFile({ content: 'alpha alpha alpha' });

    const hits = await searchLocalFiles('alpha');

    expect(hits).toHaveLength(1);
    expect(hits[0].matchCount).toBe(3);
  });

  it('ranks documents with more matches first', async () => {
    await addFile({ name: 'few.md', path: '/few.md', content: 'beta' });
    await addFile({ name: 'many.md', path: '/many.md', content: 'beta beta beta' });

    const hits = await searchLocalFiles('beta');

    expect(hits.map((h) => h.fileName)).toEqual(['many.md', 'few.md']);
  });

  it('ignores queries shorter than two characters', async () => {
    await addFile({ content: 'aaa' });

    expect(await searchLocalFiles('a')).toEqual([]);
    expect(await searchLocalFiles('')).toEqual([]);
  });

  it('returns nothing when no document matches', async () => {
    await addFile({ content: 'nothing relevant' });

    expect(await searchLocalFiles('absent')).toEqual([]);
  });

  it('respects the result limit', async () => {
    for (let i = 0; i < 5; i++) {
      await addFile({ name: `f${i}.md`, path: `/f${i}.md`, content: 'gamma' });
    }

    expect(await searchLocalFiles('gamma', 3)).toHaveLength(3);
  });

  it('picks up content changes without an explicit invalidation', async () => {
    const file = await addFile({ content: 'before' });
    expect(await searchLocalFiles('before')).toHaveLength(1);

    await fileStorageDB.updateFile(file.id, 'after');
    invalidateLocalSearchIndex();

    expect(await searchLocalFiles('before')).toEqual([]);
    expect(await searchLocalFiles('after')).toHaveLength(1);
  });

  it('drops deleted documents from results', async () => {
    const file = await addFile({ content: 'delta' });
    expect(await searchLocalFiles('delta')).toHaveLength(1);

    await fileStorageDB.deleteFile(file.id);
    invalidateLocalSearchIndex();

    expect(await searchLocalFiles('delta')).toEqual([]);
  });
});

describe('listLocalFiles', () => {
  it('lists stored documents sorted by path', async () => {
    await addFile({ name: 'b.md', path: '/b.md' });
    await addFile({ name: 'a.md', path: '/a.md' });

    const files = await listLocalFiles();

    expect(files.map((f) => f.path)).toEqual(['/a.md', '/b.md']);
  });

  it('returns an empty list when nothing is stored', async () => {
    expect(await listLocalFiles()).toEqual([]);
  });
});
