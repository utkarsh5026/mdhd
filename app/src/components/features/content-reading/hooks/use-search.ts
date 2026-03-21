import { useEffect, useMemo, useRef, useState } from 'react';

import type { MarkdownSection } from '@/services/section/parsing';
import { removeMarkdownFormatting } from '@/services/section/parsing';

export interface SearchResult {
  sectionIndex: number;
  sectionTitle: string;
  sectionLevel: number;
  matchType: 'title' | 'content';
  snippet: string;
  matchStart: number;
  matchLength: number;
}

const MAX_RESULTS = 50;
const DEBOUNCE_MS = 150;

function searchSections(
  sections: MarkdownSection[],
  plainTexts: string[],
  query: string
): SearchResult[] {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    const titleLower = section.title.toLowerCase();
    const titleIdx = titleLower.indexOf(lowerQuery);
    if (titleIdx !== -1) {
      results.push({
        sectionIndex: i,
        sectionTitle: section.title,
        sectionLevel: section.level,
        matchType: 'title',
        snippet: section.title,
        matchStart: titleIdx,
        matchLength: query.length,
      });
    }

    const plainContent = plainTexts[i];
    const contentLower = plainContent.toLowerCase();
    const contentIdx = contentLower.indexOf(lowerQuery);
    if (contentIdx !== -1) {
      const snippetStart = Math.max(0, contentIdx - 40);
      const snippetEnd = Math.min(plainContent.length, contentIdx + query.length + 60);
      const prefix = snippetStart > 0 ? '...' : '';
      const suffix = snippetEnd < plainContent.length ? '...' : '';
      const snippet = prefix + plainContent.slice(snippetStart, snippetEnd) + suffix;
      results.push({
        sectionIndex: i,
        sectionTitle: section.title,
        sectionLevel: section.level,
        matchType: 'content',
        snippet,
        matchStart: contentIdx - snippetStart + prefix.length,
        matchLength: query.length,
      });
    }

    if (results.length >= MAX_RESULTS) break;
  }

  return results;
}

export function useSearch(sections: MarkdownSection[]) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const plainTexts = useMemo(
    () => sections.map((s) => removeMarkdownFormatting(s.content)),
    [sections]
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const results = useMemo(
    () => searchSections(sections, plainTexts, debouncedQuery),
    [sections, plainTexts, debouncedQuery]
  );

  const reset = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return { query, setQuery, results, reset };
}
