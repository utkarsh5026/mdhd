import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { parseMarkdownIntoSections } from "@/services/section/parsing";
import type { MarkdownSection } from "@/services/section/parsing";

interface ReadingState {
  sections: MarkdownSection[];
  readSections: Set<number>;
  currentIndex: number;
  isTransitioning: boolean;
  isInitialized: boolean;
  markdownInput: string;
  markdownHash: string;
  startTime: number;
}

interface ReadingActions {
  goToNext: () => void;
  goToPrevious: () => void;
  changeSection: (index: number) => void;
  initializeReading: (markdownInput: string) => void;
  markSectionAsRead: (index: number) => void;
  resetReading: () => void;
  getSection: (index: number) => MarkdownSection | null;
}

/**
 * 📚 Reading Store
 *
 * Manages reading sessions and section navigation using Zustand.
 * Centralizes all reading-related logic including:
 * - Section parsing and management
 * - Navigation between sections
 * - Reading progress tracking
 * - Transition states
 *
 * 🎯 Provides global state management for reading functionality
 */
export const useReadingStore = create<ReadingState & ReadingActions>()(
  devtools(
    (set, get) => ({
      sections: [],
      readSections: new Set<number>(),
      currentIndex: 0,
      isTransitioning: false,
      isInitialized: false,
      markdownInput: "",
      markdownHash: "",
      startTime: Date.now(),

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
      markSectionAsRead: (index: number) =>
        set((state) => ({
          readSections: new Set(state.readSections).add(index),
        })),

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
      changeSection: (newIndex: number) => {
        const state = get();
        if (newIndex < 0 || newIndex >= state.sections.length) return;

        set({ isTransitioning: true });

        setTimeout(() => {
          set((currentState) => ({
            currentIndex: newIndex,
            isTransitioning: false,
            readSections: new Set(currentState.readSections).add(newIndex),
            startTime: Date.now(),
          }));
        }, 200);
      },

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
      getSection: (index: number) => {
        const { sections } = get();
        if (index < 0 || index >= sections.length) return null;
        return sections[index];
      },

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
      goToNext: () => {
        const { currentIndex, sections, changeSection } = get();
        if (currentIndex < sections.length - 1) {
          changeSection(currentIndex + 1);
        }
      },

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
      goToPrevious: () => {
        const { currentIndex, changeSection } = get();
        if (currentIndex > 0) {
          changeSection(currentIndex - 1);
        }
      },

      /**
       * 🎬 Initialize reading session
       *
       * ```ascii
       *    🚀 Start
       *    ┌─────────┐
       *    │ Setup   │ ➡️ Ready to read
       *    │ State   │ 🔄 Hash check
       *    └─────────┘
       * ```
       */
      initializeReading: (markdownInput: string) => {
        if (!markdownInput.trim()) return;

        const newHash = hashString(markdownInput);
        const currentState = get();

        // Return early if content hasn't changed
        if (
          currentState.markdownHash === newHash &&
          currentState.isInitialized
        ) {
          return;
        }

        const parsedSections = parseMarkdownIntoSections(markdownInput);

        set({
          sections: parsedSections,
          readSections: new Set([0]),
          currentIndex: 0,
          isInitialized: true,
          markdownInput,
          markdownHash: newHash,
          startTime: Date.now(),
        });
      },

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
      resetReading: () =>
        set({
          sections: [],
          readSections: new Set<number>(),
          currentIndex: 0,
          isInitialized: false,
          isTransitioning: false,
          markdownInput: "",
          markdownHash: "",
          startTime: Date.now(),
        }),
    }),
    {
      name: "reading-store", // Name for devtools
    }
  )
);

export const useReadingSections = () =>
  useReadingStore((state) => state.sections);

export const useReadingProgress = () =>
  useReadingStore((state) => ({
    readSections: state.readSections,
    currentIndex: state.currentIndex,
    totalSections: state.sections.length,
  }));

export const useReadingNavigation = () =>
  useReadingStore((state) => ({
    goToNext: state.goToNext,
    goToPrevious: state.goToPrevious,
    changeSection: state.changeSection,
  }));

export const useReadingState = () =>
  useReadingStore((state) => ({
    isTransitioning: state.isTransitioning,
    isInitialized: state.isInitialized,
  }));

// Simple hash function for markdown content
const hashString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString();
};
