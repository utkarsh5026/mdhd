import React, { useState, useCallback, useMemo } from 'react';

/**
 * Splits React children into sentence groups.
 *
 * Text nodes are split on '. ' boundaries (period + space).
 * Inline elements (code, links, strong, etc.) are treated as atomic units
 * and attached to the current sentence being built.
 *
 * Exported separately so it can be tested independently of hook state.
 */
export function splitChildrenIntoSentences(children: React.ReactNode): React.ReactNode[][] {
  const childArray = React.Children.toArray(children);
  const sentences: React.ReactNode[][] = [[]];

  for (const child of childArray) {
    if (typeof child === 'string') {
      const parts = child.split('. ');
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
