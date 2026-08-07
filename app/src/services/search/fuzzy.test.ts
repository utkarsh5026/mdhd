import { describe, expect, it } from 'vitest';

import { fuzzyMatch, fuzzyRank } from './fuzzy';

describe('fuzzyMatch', () => {
  it('matches a contiguous substring', () => {
    expect(fuzzyMatch('read', 'README.md')?.positions).toEqual([0, 1, 2, 3]);
  });

  it('matches a scattered subsequence', () => {
    expect(fuzzyMatch('rdme', 'README.md')).not.toBeNull();
  });

  it('returns null when a character is missing', () => {
    expect(fuzzyMatch('xyz', 'README.md')).toBeNull();
  });

  it('returns null when characters are out of order', () => {
    expect(fuzzyMatch('daer', 'read')).toBeNull();
  });

  it('matches the empty query with a neutral score', () => {
    expect(fuzzyMatch('', 'anything')).toEqual({ score: 0, positions: [] });
  });

  it('is case-insensitive', () => {
    expect(fuzzyMatch('RDM', 'readme.md')).not.toBeNull();
  });

  it('scores contiguous matches above scattered ones', () => {
    const contiguous = fuzzyMatch('read', 'readme.md')!.score;
    const scattered = fuzzyMatch('rdme', 'readme.md')!.score;

    expect(contiguous).toBeGreaterThan(scattered);
  });

  it('rewards matches at word boundaries', () => {
    const boundary = fuzzyMatch('gs', 'getting/started.md')!.score;
    const midWord = fuzzyMatch('et', 'getting/started.md')!.score;

    expect(boundary).toBeGreaterThan(midWord);
  });

  it('prefers shorter candidates for an equal match', () => {
    const short = fuzzyMatch('api', 'api.md')!.score;
    const long = fuzzyMatch('api', 'api-reference-appendix.md')!.score;

    expect(short).toBeGreaterThan(long);
  });

  it('reports positions that index into the candidate', () => {
    const match = fuzzyMatch('gs', 'getting/started.md')!;

    expect(match.positions.map((i) => 'getting/started.md'[i]).join('')).toBe('gs');
  });
});

describe('fuzzyRank', () => {
  const files = ['docs/api.md', 'docs/getting-started.md', 'README.md', 'src/index.ts'];

  it('ranks the best match first', () => {
    const ranked = fuzzyRank('api', files, (f) => f);
    expect(ranked[0].item).toBe('docs/api.md');
  });

  it('drops non-matching candidates', () => {
    const ranked = fuzzyRank('zzz', files, (f) => f);
    expect(ranked).toEqual([]);
  });

  it('returns everything for an empty query, in input order', () => {
    const ranked = fuzzyRank('', files, (f) => f);
    expect(ranked.map((r) => r.item)).toEqual(files);
  });

  it('respects the limit', () => {
    expect(fuzzyRank('d', files, (f) => f, 2)).toHaveLength(2);
  });

  it('matches across path separators', () => {
    const ranked = fuzzyRank('dgs', files, (f) => f);
    expect(ranked[0].item).toBe('docs/getting-started.md');
  });
});
