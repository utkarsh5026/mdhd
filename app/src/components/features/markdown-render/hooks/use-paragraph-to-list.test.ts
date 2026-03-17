import React from 'react';
import { describe, it, expect } from 'vitest';
import { splitChildrenIntoSentences } from './use-paragraph-to-list';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract plain text from a sentence group (array of React nodes). */
function sentenceText(nodes: React.ReactNode[]): string {
  return nodes
    .map((n) => (typeof n === 'string' ? n : `<node:${(n as React.ReactElement).type}>`))
    .join('');
}

function texts(result: React.ReactNode[][]): string[] {
  return result.map(sentenceText);
}

// ---------------------------------------------------------------------------
// splitChildrenIntoSentences — pure function tests
// ---------------------------------------------------------------------------

describe('splitChildrenIntoSentences', () => {
  describe('single string child', () => {
    it('returns one item for a single sentence without a trailing period', () => {
      const result = splitChildrenIntoSentences('Hello world');
      expect(result).toHaveLength(1);
      expect(texts(result)).toEqual(['Hello world']);
    });

    it('returns one item for a single sentence with a trailing period', () => {
      const result = splitChildrenIntoSentences('Hello world.');
      expect(result).toHaveLength(1);
      expect(texts(result)).toEqual(['Hello world.']);
    });

    it('splits two sentences separated by ". "', () => {
      const result = splitChildrenIntoSentences('First sentence. Second sentence.');
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['First sentence.', 'Second sentence.']);
    });

    it('splits three sentences correctly', () => {
      const result = splitChildrenIntoSentences(
        'React renders components top-down. Props flow from parent to child. State is local to each component.'
      );
      expect(result).toHaveLength(3);
      expect(texts(result)).toEqual([
        'React renders components top-down.',
        'Props flow from parent to child.',
        'State is local to each component.',
      ]);
    });

    it('does NOT split on a period not followed by a space (e.g. URLs, abbreviations)', () => {
      const result = splitChildrenIntoSentences('Visit https://example.com for details.');
      expect(result).toHaveLength(1);
    });

    it('does NOT split on a period at the very end of a string (no trailing space)', () => {
      const result = splitChildrenIntoSentences('One sentence.');
      expect(result).toHaveLength(1);
    });

    it('filters out empty sentences from leading/trailing separators', () => {
      // Edge case: string that starts with ". " — should not produce empty first item
      const result = splitChildrenIntoSentences('. Second sentence.');
      expect(result.every((s) => s.length > 0)).toBe(true);
    });
  });

  describe('mixed children (string + React elements)', () => {
    // Note: React.Children.toArray clones elements with stable keys, so we
    // cannot use reference equality. We check by element type instead.

    it('keeps React elements in the current sentence', () => {
      const codeEl = React.createElement('code', { key: 'c' }, 'foo');
      // "Call " + <code>foo</code> + " here. Next sentence."
      const result = splitChildrenIntoSentences(['Call ', codeEl, ' here. Next sentence.']);
      expect(result).toHaveLength(2);
      const first = result[0];
      expect(first).toContain('Call ');
      // The cloned <code> element should be present — check by type
      const hasCode = first.some((n) => React.isValidElement(n) && n.type === 'code');
      expect(hasCode).toBe(true);
    });

    it('attaches a React element to whichever sentence is current when it appears', () => {
      const bold = React.createElement('strong', { key: 'b' }, 'important');
      // "First sentence. " + <strong>important</strong> + " continues."
      const result = splitChildrenIntoSentences(['First sentence. ', bold, ' continues.']);
      expect(result).toHaveLength(2);
      // bold should be in the second sentence
      const hasStrong = result[1].some((n) => React.isValidElement(n) && n.type === 'strong');
      expect(hasStrong).toBe(true);
    });

    it('handles a React element as the only child', () => {
      const el = React.createElement('strong', { key: 's' }, 'bold');
      const result = splitChildrenIntoSentences(el);
      expect(result).toHaveLength(1);
      const hasStrong = result[0].some((n) => React.isValidElement(n) && n.type === 'strong');
      expect(hasStrong).toBe(true);
    });
  });

  describe('empty / whitespace children', () => {
    it('returns an empty array for an empty string', () => {
      const result = splitChildrenIntoSentences('');
      expect(result).toHaveLength(0);
    });

    it('returns an empty array for a whitespace-only string', () => {
      const result = splitChildrenIntoSentences('   ');
      expect(result).toHaveLength(0);
    });

    it('returns an empty array for null children', () => {
      const result = splitChildrenIntoSentences(null);
      expect(result).toHaveLength(0);
    });
  });

  describe('sentence count', () => {
    it('correctly counts 4 sentences', () => {
      const input =
        'One thing happens. Then another follows. A third point emerges. Finally it concludes.';
      expect(splitChildrenIntoSentences(input)).toHaveLength(4);
    });
  });
});
