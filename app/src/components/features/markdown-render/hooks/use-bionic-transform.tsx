import React, { useMemo } from 'react';
import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';

const MIN_WORD_LENGTH = 4;
const BOLD_PERCENTAGE = 0.45;

/**
 * Transforms a single word by bolding its first ~45% of characters.
 * Words shorter than MIN_WORD_LENGTH are returned unchanged.
 */
function bionicifyWord(word: string): React.ReactNode {
  if (word.length < MIN_WORD_LENGTH) return word;

  const boldEnd = Math.ceil(word.length * BOLD_PERCENTAGE);
  return (
    <span key={word}>
      <strong>{word.slice(0, boldEnd)}</strong>
      {word.slice(boldEnd)}
    </span>
  );
}

/**
 * Recursively transforms React children by bolding the first ~45% of each word.
 * Skips inline code (`<code>`) elements entirely to preserve code formatting.
 * Exported for direct use where the hook pattern doesn't fit (e.g. per-sentence transforms).
 */
export function transformBionicChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      const tokens = child.split(/(\s+)/);
      return tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return token;
        return <React.Fragment key={i}>{bionicifyWord(token)}</React.Fragment>;
      });
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      if (child.type === 'code' || child.type === 'pre') {
        return child;
      }
      return React.cloneElement(child, {}, transformBionicChildren(child.props.children));
    }

    return child;
  });
}

/**
 * Hook that optionally applies bionic reading transformation to children.
 * Reads the bionicReading setting from the store and memoizes the result.
 */
export function useBionicTransform(children: React.ReactNode): React.ReactNode {
  const bionicReading = useReadingSettingsStore((s) => s.settings.bionicReading);

  return useMemo(
    () => (bionicReading ? transformBionicChildren(children) : children),
    [bionicReading, children]
  );
}
