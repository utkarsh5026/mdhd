import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import { type MarkdownSection, countWords } from '@/services/section/parsing';

const STORAGE_VERSION = 1;
const STORAGE_KEY = 'reading-session-storage';

interface ReadingState {
  sections: MarkdownSection[];
  readSections: Set<number>;
  currentIndex: number;
  isTransitioning: boolean;
  isInitialized: boolean;
  markdownInput: string;
  markdownHash: string;
  startTime: number;
  totalWordCount: number;
  // Zen mode state
  isZenMode: boolean;
  zenControlsVisible: boolean;
  // Dialog overlay state (to hide controls when dialogs are open)
  isDialogOpen: boolean;
  // Persistence version
  version: number;
  // Hydration tracking (not persisted)
  _hasHydrated: boolean;
}

interface ReadingActions {
  goToNext: () => void;
  goToPrevious: () => void;
  changeSection: (index: number) => void;
  initializeReading: (markdownInput: string) => void;
  markSectionAsRead: (index: number) => void;
  resetReading: () => void;
  getSection: (index: number) => MarkdownSection | null;
  // Zen mode actions
  toggleZenMode: () => void;
  setZenMode: (isZen: boolean) => void;
  showZenControls: () => void;
  hideZenControls: () => void;
  // Dialog overlay actions
  setDialogOpen: (isOpen: boolean) => void;
  clearPersistedSession: () => void;
}

interface PersistedState {
  state: Partial<ReadingState>;
  version?: number;
}

/**
 * 🗄️ Custom Storage Adapter
 *
 * Handles Set serialization for localStorage persistence.
 * Converts Set<number> to Array for JSON serialization.
 */
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    try {
      const parsed = JSON.parse(str);
      // Convert readSections array back to Set
      if (parsed.state?.readSections && Array.isArray(parsed.state.readSections)) {
        parsed.state.readSections = new Set(parsed.state.readSections);
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing reading session:', e);
      return null;
    }
  },

  setItem: (name: string, value: PersistedState) => {
    try {
      const serialized = {
        ...value,
        state: {
          ...value.state,
          // Convert Set to array for JSON serialization
          readSections: Array.from(value.state.readSections || []),
        },
      };
      localStorage.setItem(name, JSON.stringify(serialized));
    } catch (e) {
      console.error('Error saving reading session:', e);
    }
  },

  removeItem: (name: string) => localStorage.removeItem(name),
};

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
    persist(
      (set, get) => ({
        sections: [],
        readSections: new Set<number>(),
        currentIndex: 0,
        isTransitioning: false,
        isInitialized: false,
        markdownInput: '',
        markdownHash: '',
        startTime: Date.now(),
        totalWordCount: 0,
        // Zen mode initial state
        isZenMode: false,
        zenControlsVisible: false,
        // Dialog overlay initial state
        isDialogOpen: false,
        // Persistence version
        version: STORAGE_VERSION,
        // Hydration tracking
        _hasHydrated: false,

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
          if (currentState.markdownHash === newHash && currentState.isInitialized) {
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
            totalWordCount: countWords(markdownInput),
          });
        },

        /**
         * 🧘 Toggle Zen Mode
         *
         * Switches between zen mode (minimal UI) and normal mode
         */
        toggleZenMode: () =>
          set((state) => ({
            isZenMode: !state.isZenMode,
            zenControlsVisible: false,
          })),

        /**
         * 🧘 Set Zen Mode
         *
         * Explicitly set zen mode on or off
         */
        setZenMode: (isZen: boolean) =>
          set({
            isZenMode: isZen,
            zenControlsVisible: false,
          }),

        /**
         * 👁️ Show Zen Controls
         *
         * Temporarily show controls in zen mode
         */
        showZenControls: () => set({ zenControlsVisible: true }),

        /**
         * 🙈 Hide Zen Controls
         *
         * Hide controls in zen mode
         */
        hideZenControls: () => set({ zenControlsVisible: false }),

        /**
         * 🎭 Set Dialog Open State
         *
         * Track when overlay dialogs are open to hide navigation controls
         */
        setDialogOpen: (isOpen: boolean) => set({ isDialogOpen: isOpen }),

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
            markdownInput: '',
            markdownHash: '',
            startTime: Date.now(),
            isZenMode: false,
            zenControlsVisible: false,
            isDialogOpen: false,
            _hasHydrated: true, // Keep hydrated state
          }),

        /**
         * 🗑️ Clear persisted session
         *
         * Removes saved session from localStorage and resets state.
         */
        clearPersistedSession: () => {
          localStorage.removeItem(STORAGE_KEY);
          set({
            sections: [],
            readSections: new Set<number>(),
            currentIndex: 0,
            isInitialized: false,
            isTransitioning: false,
            markdownInput: '',
            markdownHash: '',
            startTime: Date.now(),
            totalWordCount: 0,
            isZenMode: false,
            zenControlsVisible: false,
            isDialogOpen: false,
            version: STORAGE_VERSION,
            _hasHydrated: true, // Keep hydrated state
          });
        },
      }),
      {
        name: STORAGE_KEY,
        storage: customStorage,
        partialize: (state) => ({
          // Only persist these fields
          markdownInput: state.markdownInput,
          markdownHash: state.markdownHash,
          currentIndex: state.currentIndex,
          readSections: state.readSections,
          totalWordCount: state.totalWordCount,
          isInitialized: state.isInitialized,
          version: state.version,
        }),
        version: STORAGE_VERSION,
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Error rehydrating reading session:', error);
          } else if (state) {
            // Re-parse sections from persisted markdown
            // (sections are not persisted to save space)
            if (state.markdownInput && state.sections.length === 0) {
              const parsedSections = parseMarkdownIntoSections(state.markdownInput);
              state.sections = parsedSections;
            }
            // Mark hydration as complete
            state._hasHydrated = true;
          }
        },
      }
    ),
    {
      name: 'reading-store', // Name for devtools
    }
  )
);

export const useReadingSections = () => useReadingStore((state) => state.sections);

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

// Individual selectors to avoid infinite re-renders
export const useIsZenMode = () => useReadingStore((state) => state.isZenMode);
export const useZenControlsVisible = () => useReadingStore((state) => state.zenControlsVisible);
export const useZenModeActions = () => {
  const toggleZenMode = useReadingStore((state) => state.toggleZenMode);
  const setZenMode = useReadingStore((state) => state.setZenMode);
  const showZenControls = useReadingStore((state) => state.showZenControls);
  const hideZenControls = useReadingStore((state) => state.hideZenControls);
  return { toggleZenMode, setZenMode, showZenControls, hideZenControls };
};

// Dialog overlay selectors
export const useIsDialogOpen = () => useReadingStore((state) => state.isDialogOpen);
export const useSetDialogOpen = () => useReadingStore((state) => state.setDialogOpen);

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
