import { useCallback, useState } from "react";

export const useCodeDetection = (
  codeRef: React.RefObject<HTMLDivElement | null>,
  upLevel: number = 3
) => {
  const [isInTableCell, setIsInTableCell] = useState(false);
  const [isInParagraph, setIsInParagraph] = useState(false);
  const [inList, setInList] = useState(false);
  const [headingLevel, setHeadingLevel] = useState<number | null>(null);

  const detectCodeInContext = useCallback(() => {
    if (codeRef.current) {
      let parent = codeRef.current.parentElement;
      let cnt = 0;

      while (parent && cnt < upLevel) {
        const tagName = parent.tagName.toLowerCase().trim();

        // Check if code is inside a table cell
        if (tagName === "td" || tagName === "th") {
          setIsInTableCell(true);
          return true;
        }

        if (tagName === "p") {
          setIsInParagraph(true);
          return true;
        }

        if (tagName === "li") {
          setInList(true);
          return true;
        }

        // Check if code is inside a heading
        if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
          setHeadingLevel(parseInt(tagName.slice(1)));
          return true;
        }

        parent = parent.parentElement;
        cnt++;
      }
      setIsInTableCell(false);
      setIsInParagraph(false);
      setHeadingLevel(null);
      return false;
    }
    return false;
  }, [codeRef, upLevel]);

  return {
    isInTableCell,
    headingLevel,
    isInParagraph,
    detectCodeInContext,
    inList,
  };
};
