import { useState, useCallback, useRef, useEffect } from 'react';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import type { MarkdownSection, MarkdownMetadata } from '@/services/section/parsing';

export const useReading = (markdownInput: string) => {
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [metadata, setMetadata] = useState<MarkdownMetadata | null>(null);
  const [readSections, setReadSections] = useState(new Set<number>());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const sectionsLengthRef = useRef(sections.length);

  currentIndexRef.current = currentIndex;
  sectionsLengthRef.current = sections.length;

  const markSectionAsRead = useCallback((index: number) => {
    setReadSections((prev) => new Set(prev).add(index));
  }, []);

  const changeSection = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= sectionsLengthRef.current) return;

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      setIsTransitioning(true);

      transitionTimeoutRef.current = setTimeout(() => {
        transitionTimeoutRef.current = null;
        setCurrentIndex(newIndex);
        setIsTransitioning(false);
        markSectionAsRead(newIndex);
        startTimeRef.current = Date.now();
      }, 200);
    },
    [markSectionAsRead]
  );

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const getSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= sections.length) return null;
      return sections[index];
    },
    [sections]
  );

  const goToNext = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx < sectionsLengthRef.current - 1) {
      changeSection(idx + 1);
    }
  }, [changeSection]);

  const goToPrevious = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx > 0) {
      changeSection(idx - 1);
    }
  }, [changeSection]);

  const initializeReading = useCallback(() => {
    if (!markdownInput.trim()) return;
    const { sections: parsedSections, metadata: parsedMetadata } =
      parseMarkdownIntoSections(markdownInput);
    setSections(parsedSections);
    setMetadata(parsedMetadata);
    setReadSections(new Set([0]));
    setCurrentIndex(0);
    setIsInitialized(true);
    startTimeRef.current = Date.now();
  }, [markdownInput]);

  const resetReading = useCallback(() => {
    setSections([]);
    setMetadata(null);
    setReadSections(new Set());
    setCurrentIndex(0);
    setIsInitialized(false);
    setIsTransitioning(false);
    initializedRef.current = false;
  }, []);

  return {
    sections,
    metadata,
    readSections,
    currentIndex,
    isTransitioning,
    isInitialized,

    goToNext,
    goToPrevious,
    changeSection,
    getSection,

    initializeReading,
    markSectionAsRead,
    resetReading,
  };
};
