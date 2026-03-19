import { useCallback } from 'react';

/**
 * Returns a stable getter that resolves the nearest preceding heading for a
 * given DOM ref. Pass the result of `getBaseName()` to `toFilename` to derive
 * context-aware export filenames.
 */
export function useNearestHeading(ref: React.RefObject<HTMLElement | null>) {
  return useCallback(() => {
    let node = ref.current;
    while (node) {
      let sibling = node.previousElementSibling as HTMLElement | null;
      while (sibling) {
        if (/^H[1-6]$/.test(sibling.tagName)) return sibling.textContent?.trim() ?? '';
        const headings = sibling.querySelectorAll('h1,h2,h3,h4,h5,h6');
        if (headings.length) return headings[headings.length - 1].textContent?.trim() ?? '';
        sibling = sibling.previousElementSibling as HTMLElement | null;
      }
      node = node.parentElement;
    }
    return '';
  }, [ref]);
}
