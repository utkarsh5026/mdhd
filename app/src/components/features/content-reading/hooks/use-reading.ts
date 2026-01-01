import { useState, useCallback, useRef } from 'react';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import type { MarkdownSection } from '@/services/section/parsing';

interface UseReadingReturn {
  sections: MarkdownSection[];
  readSections: Set<number>;
  currentIndex: number;
  isTransitioning: boolean;
  isInitialized: boolean;

  goToNext: () => void;
  goToPrevious: () => void;
  changeSection: (index: number) => void;

  initializeReading: () => void;
  markSectionAsRead: (index: number) => void;
  resetReading: () => void;
  getSection: (index: number) => MarkdownSection | null;
}

/**
 * 📚 Hook for managing reading sessions and section navigation
 *
 * This hook centralizes all reading-related logic including:
 * - Section parsing and management
 * - Navigation between sections
 * - Reading progress tracking
 * - Transition states
 *
 * 🎯 Makes components cleaner by extracting complex reading logic
 */
/**
 * 🎮 useReading Hook
 *
 * Manages reading flow and section navigation
 *
 * ```ascii
 *    📖 Content
 *    ┌─────────┐
 *    │ Section │ ➡️ Navigate between sections
 *    │   1     │
 *    └─────────┘
 *
 *    🔄 State
 *    ┌─────────┐
 *    │ Reading │ 📝 Track progress
 *    │ Progress│
 *    └─────────┘
 * ```
 */
export const useReading = (markdownInput: string): UseReadingReturn => {
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [readSections, setReadSections] = useState(new Set<number>());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);

  /**
   * 📖 Mark section as read
   *
   * ```ascii
   *    📚 Progress
   *    ┌─────────┐
   *    │ Section │ ✅ Mark complete
   *    │ Status  │
   *    └─────────┘
   * ```
   */
  const markSectionAsRead = useCallback((index: number) => {
    setReadSections((prev) => new Set(prev).add(index));
  }, []);

  /**
   * 🔄 Change current section
   *
   * ```ascii
   *    🔀 Navigation
   *    ┌─────────┐
   *    │ Current │ ➡️ New section
   *    │ Section │ 🕒 Fade transition
   *    └─────────┘
   * ```
   */
  const changeSection = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= sections.length) return;

      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentIndex(newIndex);
        setIsTransitioning(false);
        markSectionAsRead(newIndex);
        startTimeRef.current = Date.now();
      }, 200);
    },
    [sections.length, markSectionAsRead]
  );

  /**
   * 🔍 Get section by index
   *
   * ```ascii
   *    📑 Sections
   *    ┌─────────┐
   *    │ Index   │ ➡️ Section data
   *    │ Lookup  │
   *    └─────────┘
   * ```
   */
  const getSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= sections.length) return null;
      return sections[index];
    },
    [sections]
  );

  /**
   * ⏭️ Go to next section
   *
   * ```ascii
   *    ➡️ Forward
   *    ┌─────────┐
   *    │ Current │ ➡️ Next
   *    │ Section │
   *    └─────────┘
   * ```
   */
  const goToNext = useCallback(() => {
    if (currentIndex < sections.length - 1) {
      changeSection(currentIndex + 1);
    }
  }, [currentIndex, sections.length, changeSection]);

  /**
   * ⏮️ Go to previous section
   *
   * ```ascii
   *    ⬅️ Back
   *    ┌─────────┐
   *    │ Current │ ⬅️ Previous
   *    │ Section │
   *    └─────────┘
   * ```
   */
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      changeSection(currentIndex - 1);
    }
  }, [currentIndex, changeSection]);

  /**
   * 🎬 Initialize reading session
   *
   * ```ascii
   *    🚀 Start
   *    ┌─────────┐
   *    │ Setup   │ ➡️ Ready to read
   *    │ State   │
   *    └─────────┘
   * ```
   */
  const initializeReading = useCallback(() => {
    if (!markdownInput.trim()) return;
    const parsedSections = parseMarkdownIntoSections(markdownInput);
    setSections(parsedSections);
    setReadSections(new Set([0]));
    setCurrentIndex(0);
    setIsInitialized(true);
    startTimeRef.current = Date.now();
  }, [markdownInput]);

  /**
   * 🔄 Reset reading state
   *
   * ```ascii
   *    🗑️ Reset
   *    ┌─────────┐
   *    │ Clear   │ ➡️ Fresh start
   *    │ State   │
   *    └─────────┘
   * ```
   */
  const resetReading = useCallback(() => {
    setSections([]);
    setReadSections(new Set());
    setCurrentIndex(0);
    setIsInitialized(false);
    setIsTransitioning(false);
    initializedRef.current = false;
  }, []);

  return {
    sections,
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
