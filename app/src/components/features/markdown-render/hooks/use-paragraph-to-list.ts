import React, { useCallback, useMemo, useState } from 'react';

/**
 * Abbreviations that NEVER end a sentence — the sentence always continues
 * after them regardless of the case of the next word.
 * Includes honorifics (Dr., Mr.), Latin abbreviations (e.g., i.e., vs.),
 * and month abbreviations (Jan., Feb., etc.).
 */
const ALWAYS_PROTECT_RE =
  /(?:vs|e\.g|i\.e|Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/;

/**
 * Abbreviations that CAN end a sentence. Protected only when followed by a
 * lowercase word (e.g. "etc. more stuff" stays together, but "etc. We" splits).
 */
const SOMETIMES_PROTECT_RE = /(?:etc|al|approx|dept|est|govt|vol|ch|fig|no|Inc|Corp|Ltd|Co)/;

const PLACEHOLDER = '\u0000';

/**
 * Splits a text string on sentence boundaries (". ") while preserving
 * abbreviations, initials (single uppercase letters), and ellipses.
 *
 * Returns the same shape as `text.split('. ')` — parts without trailing periods
 * except the final segment which keeps its trailing period if present.
 */
function splitTextOnSentenceBoundaries(text: string): string[] {
  // Protect abbreviations that never end sentences (unconditional):
  // "Dr. Smith" → "Dr\0 Smith", "vs. Angular" → "vs\0 Angular"
  let safe = text.replace(
    new RegExp(`(\\b${ALWAYS_PROTECT_RE.source})\\. `, 'g'),
    `$1${PLACEHOLDER} `
  );

  // Protect context-dependent abbreviations only when followed by lowercase:
  // "etc. more" → "etc\0 more"  but  "etc. We" → left as-is (will split)
  safe = safe.replace(
    new RegExp(`(\\b${SOMETIMES_PROTECT_RE.source})\\. (?=[a-z])`, 'g'),
    `$1${PLACEHOLDER} `
  );

  // Protect single-letter initials: "J. " → "J\0 "
  safe = safe.replace(/\b([A-Z])\. /g, `$1${PLACEHOLDER} `);

  // Protect ellipses: "... " → "..\0 "
  safe = safe.replace(/\.\.\. /g, `..${PLACEHOLDER} `);

  // Now split on genuine sentence boundaries
  const parts = safe.split('. ');

  // Restore placeholders
  return parts.map((p) => p.split(PLACEHOLDER).join('.'));
}

/**
 * Splits React children into sentence groups.
 *
 * Text nodes are split on sentence boundaries (". ") while intelligently
 * preserving abbreviations (e.g., vs., Dr., etc.), single-letter initials,
 * and ellipses. Inline elements (code, links, strong, etc.) are treated as
 * atomic units and attached to the current sentence being built.
 *
 * Exported separately so it can be tested independently of hook state.
 */
export function splitChildrenIntoSentences(children: React.ReactNode): React.ReactNode[][] {
  const childArray = React.Children.toArray(children);
  const sentences: React.ReactNode[][] = [[]];

  for (const child of childArray) {
    if (typeof child === 'string') {
      const parts = splitTextOnSentenceBoundaries(child);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (!isLast) {
          if (part) sentences[sentences.length - 1].push(part + '.');
          sentences.push([]);
        } else {
          if (part) sentences[sentences.length - 1].push(part);
        }
      }
    } else {
      sentences[sentences.length - 1].push(child);
    }
  }

  return sentences.filter((s) => s.some((n) => (typeof n === 'string' ? n.trim() : true)));
}

interface UseParagraphToListReturn {
  isListView: boolean;
  sentences: React.ReactNode[][];
  toggleListView: (e: React.MouseEvent) => void;
}

/**
 * Manages the paragraph ↔ list toggle state and derives sentence groups
 * from the paragraph's children when list view is active.
 */
export function useParagraphToList(children: React.ReactNode): UseParagraphToListReturn {
  const [isListView, setIsListView] = useState(false);

  const toggleListView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsListView((prev) => !prev);
  }, []);

  const sentences = useMemo(
    () => (isListView ? splitChildrenIntoSentences(children) : []),
    [isListView, children]
  );

  return { isListView, sentences, toggleListView };
}
