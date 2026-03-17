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

    it('does NOT split on a period not followed by a space (e.g. URLs)', () => {
      const result = splitChildrenIntoSentences('Visit https://example.com for details.');
      expect(result).toHaveLength(1);
    });

    it('does NOT split on a period at the very end of a string (no trailing space)', () => {
      const result = splitChildrenIntoSentences('One sentence.');
      expect(result).toHaveLength(1);
    });

    it('does NOT split on common abbreviations like "vs."', () => {
      const result = splitChildrenIntoSentences(
        'React vs. Angular is a common debate. Both are good frameworks.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'React vs. Angular is a common debate.',
        'Both are good frameworks.',
      ]);
    });

    it('does NOT split on "e.g." or "i.e."', () => {
      const result = splitChildrenIntoSentences(
        'Use a bundler e.g. Vite or Webpack. It will improve performance.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'Use a bundler e.g. Vite or Webpack.',
        'It will improve performance.',
      ]);
    });

    it('does NOT split on honorifics like "Dr." or "Mr."', () => {
      const result = splitChildrenIntoSentences('Dr. Smith joined the team. He started on Monday.');
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['Dr. Smith joined the team.', 'He started on Monday.']);
    });

    it('does NOT split on single-letter initials', () => {
      const result = splitChildrenIntoSentences(
        'J. K. Rowling wrote Harry Potter. The series has seven books.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'J. K. Rowling wrote Harry Potter.',
        'The series has seven books.',
      ]);
    });

    it('does NOT split on ellipses', () => {
      const result = splitChildrenIntoSentences(
        'Wait for it... The answer is 42. That was unexpected.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['Wait for it... The answer is 42.', 'That was unexpected.']);
    });

    it('does NOT split on "etc."', () => {
      const result = splitChildrenIntoSentences('Bring fruits, vegetables, etc. We need supplies.');
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['Bring fruits, vegetables, etc.', 'We need supplies.']);
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

  describe('abbreviation-aware splitting', () => {
    it('handles "i.e." followed by lowercase', () => {
      const result = splitChildrenIntoSentences(
        'Use a framework i.e. a structured toolkit. It saves time.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'Use a framework i.e. a structured toolkit.',
        'It saves time.',
      ]);
    });

    it('handles "i.e." followed by uppercase (still part of same sentence)', () => {
      const result = splitChildrenIntoSentences(
        'Use a framework i.e. React or Vue. Both are popular.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['Use a framework i.e. React or Vue.', 'Both are popular.']);
    });

    it('handles multiple abbreviations in one paragraph', () => {
      const result = splitChildrenIntoSentences('Dr. Smith vs. Dr. Jones debated. It was intense.');
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['Dr. Smith vs. Dr. Jones debated.', 'It was intense.']);
    });

    it('handles "Mrs." and "Ms."', () => {
      const result = splitChildrenIntoSentences(
        'Mrs. Dalloway said she would buy the flowers. Ms. Kilman disagreed.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'Mrs. Dalloway said she would buy the flowers.',
        'Ms. Kilman disagreed.',
      ]);
    });

    it('handles "Prof." before a name', () => {
      const result = splitChildrenIntoSentences(
        'Prof. Xavier founded the school. It opened in 1963.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['Prof. Xavier founded the school.', 'It opened in 1963.']);
    });

    it('handles month abbreviations', () => {
      const result = splitChildrenIntoSentences(
        'The event is on Jan. 5th at the hall. Tickets are available now.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'The event is on Jan. 5th at the hall.',
        'Tickets are available now.',
      ]);
    });

    it('handles "Inc." as sentence-ending when followed by uppercase', () => {
      const result = splitChildrenIntoSentences('She works at Acme Inc. They make widgets.');
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['She works at Acme Inc.', 'They make widgets.']);
    });

    it('keeps "Inc." when followed by lowercase', () => {
      const result = splitChildrenIntoSentences(
        'Acme Inc. recently announced a merger. The deal closes Friday.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'Acme Inc. recently announced a merger.',
        'The deal closes Friday.',
      ]);
    });

    it('handles "etc." mid-sentence with lowercase continuation', () => {
      const result = splitChildrenIntoSentences(
        'Bring fruits, vegetables, etc. and other items. We need supplies.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'Bring fruits, vegetables, etc. and other items.',
        'We need supplies.',
      ]);
    });

    it('handles "vs." at end of sentence before uppercase word', () => {
      const result = splitChildrenIntoSentences(
        'The debate was React vs. Angular. Both have strengths.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['The debate was React vs. Angular.', 'Both have strengths.']);
    });

    it('handles multiple initials in a row', () => {
      const result = splitChildrenIntoSentences(
        'C. S. Lewis was a famous author. He wrote Narnia.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['C. S. Lewis was a famous author.', 'He wrote Narnia.']);
    });

    it('handles ellipsis mid-sentence', () => {
      const result = splitChildrenIntoSentences(
        'He thought about it... and then decided. The choice was clear.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'He thought about it... and then decided.',
        'The choice was clear.',
      ]);
    });

    it('handles a dense paragraph with many abbreviations', () => {
      const result = splitChildrenIntoSentences(
        'Dr. J. R. Smith et al. published a study. It compared React vs. Vue i.e. two popular frameworks. The results were surprising.'
      );
      expect(result).toHaveLength(3);
      expect(texts(result)).toEqual([
        'Dr. J. R. Smith et al. published a study.',
        'It compared React vs. Vue i.e. two popular frameworks.',
        'The results were surprising.',
      ]);
    });

    it('does NOT split on file extensions like ".js" or ".tsx"', () => {
      const result = splitChildrenIntoSentences(
        'Edit the file index.js to fix the bug. Then run the tests.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'Edit the file index.js to fix the bug.',
        'Then run the tests.',
      ]);
    });

    it('handles decimal numbers without splitting', () => {
      const result = splitChildrenIntoSentences('The version is 3.14. It was released last week.');
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual(['The version is 3.14.', 'It was released last week.']);
    });

    it('handles sentence with only abbreviation content', () => {
      const result = splitChildrenIntoSentences('Dr. Smith');
      expect(result).toHaveLength(1);
      expect(texts(result)).toEqual(['Dr. Smith']);
    });

    it('handles "Sr." and "Jr." before names', () => {
      const result = splitChildrenIntoSentences(
        'Robert Downey Jr. starred in the film. Sr. Lopez directed it.'
      );
      expect(result).toHaveLength(2);
      expect(texts(result)).toEqual([
        'Robert Downey Jr. starred in the film.',
        'Sr. Lopez directed it.',
      ]);
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
