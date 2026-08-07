/** Characters of context kept on either side of a match. */
const SNIPPET_LEAD = 40;
const SNIPPET_TRAIL = 60;

/** A match rendered as a one-line excerpt, with offsets into that excerpt. */
export interface Snippet {
  snippet: string;
  /** Offset of the match within {@link snippet}, after whitespace collapsing. */
  matchStart: number;
  matchLength: number;
}

/** Collapses runs of whitespace so multi-line code excerpts render on one line. */
const collapse = (text: string): string => text.replace(/\s+/g, ' ');

/**
 * Builds a display excerpt around a match.
 *
 * Whitespace is collapsed for display, but the returned offsets are computed
 * from the collapsed prefix rather than the raw one, so callers can slice
 * `snippet` directly to split it into before/match/after.
 *
 * @param text - The full text the match was found in.
 * @param matchIndex - Index of the match within `text`.
 * @param matchLength - Length of the matched substring.
 */
export function buildSnippet(text: string, matchIndex: number, matchLength: number): Snippet {
  const windowStart = Math.max(0, matchIndex - SNIPPET_LEAD);
  const windowEnd = Math.min(text.length, matchIndex + matchLength + SNIPPET_TRAIL);

  const prefix = windowStart > 0 ? '…' : '';
  const suffix = windowEnd < text.length ? '…' : '';

  const before = prefix + collapse(text.slice(windowStart, matchIndex));
  const match = collapse(text.slice(matchIndex, matchIndex + matchLength));
  const after = collapse(text.slice(matchIndex + matchLength, windowEnd)) + suffix;

  return {
    snippet: before + match + after,
    matchStart: before.length,
    matchLength: match.length,
  };
}
