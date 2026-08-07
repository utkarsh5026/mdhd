/**
 * Subsequence matching for quick-open, in the style editors use for file
 * pickers: `rdme` should find `README.md`, `cfeat` should find
 * `components/features`.
 */

/** A successful match, with the positions to highlight and a ranking score. */
export interface FuzzyMatch {
  /** Higher is better. Only comparable between candidates for the same query. */
  score: number;
  /** Indices in the candidate that matched, ascending. */
  positions: number[];
}

const SCORE_CONSECUTIVE = 8;
const SCORE_BOUNDARY = 10;
const SCORE_CASE_MATCH = 2;
/** Charged per character skipped, so tighter matches outrank scattered ones. */
const PENALTY_GAP = 1;
/** Cap on the gap penalty, so a late match in a long path is not written off. */
const MAX_GAP_PENALTY = 20;

/** Characters after which the next character starts a new "word". */
const BOUNDARY_CHARS = new Set(['/', '-', '_', '.', ' ']);

/**
 * Scores `query` against `candidate` as a subsequence match.
 *
 * Greedy left-to-right: for each query character it takes the first remaining
 * occurrence. That is not always the highest-scoring alignment, but it is
 * linear and predictable, which matters more than optimality when results
 * update on every keystroke.
 *
 * @param query - What the user typed. Empty queries match with score 0.
 * @param candidate - The string being ranked, e.g. a file path.
 * @returns The match, or `null` when `query` is not a subsequence.
 */
export function fuzzyMatch(query: string, candidate: string): FuzzyMatch | null {
  if (!query) return { score: 0, positions: [] };
  if (!candidate) return null;

  const lowerQuery = query.toLowerCase();
  const lowerCandidate = candidate.toLowerCase();

  const positions: number[] = [];
  let score = 0;
  let cursor = 0;
  let previousMatch = -1;

  for (const char of lowerQuery) {
    const at = lowerCandidate.indexOf(char, cursor);
    if (at === -1) return null;

    if (at === previousMatch + 1) {
      score += SCORE_CONSECUTIVE;
    } else {
      const gap = at - (previousMatch + 1);
      score -= Math.min(gap * PENALTY_GAP, MAX_GAP_PENALTY);
    }

    const isBoundary = at === 0 || BOUNDARY_CHARS.has(candidate[at - 1]);
    if (isBoundary) score += SCORE_BOUNDARY;

    // Typing an uppercase letter that lines up is a strong intent signal.
    if (candidate[at] === query[positions.length]) score += SCORE_CASE_MATCH;

    positions.push(at);
    previousMatch = at;
    cursor = at + 1;
  }

  // Prefer shorter candidates when the match is otherwise equal — `api.md`
  // should beat `api-reference-appendix.md` for the query `api`.
  score -= Math.floor(candidate.length / 10);

  return { score, positions };
}

/**
 * Filters and ranks candidates by fuzzy match against `query`.
 *
 * @param query - What the user typed. Empty returns everything, unranked.
 * @param items - Candidates to rank.
 * @param toText - Extracts the string to match for each item.
 * @param limit - Maximum results to return.
 */
export function fuzzyRank<T>(
  query: string,
  items: readonly T[],
  toText: (item: T) => string,
  limit?: number
): Array<{ item: T; match: FuzzyMatch }> {
  const trimmed = query.trim();

  const ranked: Array<{ item: T; match: FuzzyMatch }> = [];
  for (const item of items) {
    const match = fuzzyMatch(trimmed, toText(item));
    if (match) ranked.push({ item, match });
  }

  if (trimmed) ranked.sort((a, b) => b.match.score - a.match.score);
  return limit === undefined ? ranked : ranked.slice(0, limit);
}
