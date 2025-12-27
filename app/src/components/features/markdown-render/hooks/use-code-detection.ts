import { useCallback, useState } from "react";

/**
 * Hook to detect the context of a code element in the DOM
 * Used to render code blocks appropriately based on their context
 * (e.g., simpler rendering in tables, lists, paragraphs)
 */
export const useCodeDetection = (
  ref: React.RefObject<HTMLElement | null>,
  maxDepth: number = 3
) => {
  const [isInTableCell, setIsInTableCell] = useState(false);
  const [headingLevel, setHeadingLevel] = useState<number | null>(null);
  const [inList, setInList] = useState(false);
  const [isInParagraph, setIsInParagraph] = useState(false);

  const detectCodeInContext = useCallback(() => {
    if (!ref.current) return false;

    let parent = ref.current.parentElement;
    let depth = 0;

    while (parent && depth < maxDepth) {
      const tagName = parent.tagName.toLowerCase();

      // Check for table cell
      if (tagName === "td" || tagName === "th") {
        setIsInTableCell(true);
        return true;
      }

      // Check for heading
      if (/^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName.charAt(1), 10);
        setHeadingLevel(level);
        return true;
      }

      // Check for list
      if (tagName === "li" || tagName === "ul" || tagName === "ol") {
        setInList(true);
        return true;
      }

      // Check for paragraph
      if (tagName === "p") {
        setIsInParagraph(true);
        return true;
      }

      parent = parent.parentElement;
      depth++;
    }

    return false;
  }, [ref, maxDepth]);

  return {
    isInTableCell,
    headingLevel,
    inList,
    isInParagraph,
    detectCodeInContext,
  };
};
