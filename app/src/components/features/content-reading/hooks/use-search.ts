import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { buildSnippet } from '@/services/search/snippet';
import type { MarkdownSection } from '@/services/section/parsing';
import { toSearchableText } from '@/services/section/parsing';

export interface SearchResult {
  /** Stable identity for React keys — sections can now yield several matches. */
  id: string;
  sectionIndex: number;
  sectionTitle: string;
  sectionLevel: number;
  matchType: 'title' | 'content';
  snippet: string;
  /** Offset of the match within {@link snippet}, after whitespace collapsing. */
  matchStart: number;
  matchLength: number;
  /** 1-based position of this match among all matches in the document. */
  ordinal: number;
}

/** Upper bound on results handed to the UI. Matches beyond this are counted, not listed. */
const MAX_RESULTS = 50;

interface SearchOutcome {
  results: SearchResult[];
  /** Total matches found, including any past {@link MAX_RESULTS}. */
  totalMatches: number;
}

const EMPTY: SearchOutcome = { results: [], totalMatches: 0 };

/**
 * Finds every occurrence of `query` across section titles and section bodies.
 *
 * Unlike a per-section first-match scan, this walks each body to the end, so a
 * term repeated throughout a long section produces one entry per occurrence —
 * the behaviour readers expect from find-in-page.
 */
function searchSections(
  sections: MarkdownSection[],
  plainTexts: string[],
  query: string
): SearchOutcome {
  if (!query || query.length < 2) return EMPTY;

  const needle = query.toLowerCase();
  const results: SearchResult[] = [];
  let totalMatches = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    const titleIndex = section.title.toLowerCase().indexOf(needle);
    if (titleIndex !== -1) {
      totalMatches++;
      if (results.length < MAX_RESULTS) {
        results.push({
          id: `${i}:title`,
          sectionIndex: i,
          sectionTitle: section.title,
          sectionLevel: section.level,
          matchType: 'title',
          snippet: section.title,
          matchStart: titleIndex,
          matchLength: query.length,
          ordinal: totalMatches,
        });
      }
    }

    const body = plainTexts[i];
    const haystack = body.toLowerCase();

    let from = 0;
    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;

      totalMatches++;
      if (results.length < MAX_RESULTS) {
        results.push({
          id: `${i}:${at}`,
          sectionIndex: i,
          sectionTitle: section.title,
          sectionLevel: section.level,
          matchType: 'content',
          ...buildSnippet(body, at, query.length),
          ordinal: totalMatches,
        });
      }

      from = at + needle.length;
    }
  }

  return { results, totalMatches };
}

/**
 * Find-in-document state for the current section list.
 *
 * The index is built with {@link toSearchableText}, so fenced and inline code
 * are searchable — looking up a function name finds the block that defines it.
 *
 * Exposes a keyboard cursor (`activeIndex`) that consumers bind to Arrow
 * Up/Down and Enter; it resets to the first result whenever the query changes.
 *
 * @param sections - Parsed sections of the active document.
 */
export function useSearch(sections: MarkdownSection[]) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const plainTexts = useMemo(() => sections.map((s) => toSearchableText(s.content)), [sections]);

  const { results, totalMatches } = useMemo(
    () => searchSections(sections, plainTexts, deferredQuery),
    [sections, plainTexts, deferredQuery]
  );

  // A new query invalidates the old cursor position.
  useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery]);

  /** Moves the cursor by `delta`, wrapping at both ends. */
  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        if (results.length === 0) return 0;
        return (current + delta + results.length) % results.length;
      });
    },
    [results.length]
  );

  const reset = useCallback(() => {
    setQuery('');
    setActiveIndex(0);
  }, []);

  return {
    query,
    setQuery,
    results,
    totalMatches,
    /** Index into `results` of the keyboard-highlighted row. */
    activeIndex,
    setActiveIndex,
    moveActive,
    reset,
  };
}
