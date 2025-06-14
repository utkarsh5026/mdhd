import { create } from "zustand";
import {
  sectionReadingService,
  SectionReadingData,
} from "@/services/reading/section-reading-service";
import type { LoadingWithError } from "../base/base";
import { parseError } from "@/utils/error";
import { sectionWorkerManager } from "@/infrastructure/workers";

type ReadingState = {
  currentSectionId: string | null;
  sectionTitle: string | null;
  documentPath: string | null;
  category: string | null; // Added category
  wordCount: number | null; // Added word count
  startTime: number | null;
  readSections: Set<string>; // Set of section IDs that have been read
};

// Store state
type StoreState = LoadingWithError & {
  readingState: ReadingState;
  categoryStats: Record<string, CategoryStats>;
  isInitialized: boolean;
};

/**
 * Stats for each category
 */
type CategoryStats = {
  totalTimeSpent: number;
  totalWordsRead: number;
  documentCount: number;
  lastReadAt: number;
};

interface StoreActions {
  initialize: () => Promise<void>;

  // Enhanced actions with category and word count
  startReading: (
    documentPath: string,
    sectionId: string,
    category: string,
    wordCount: number,
    sectionTitle?: string,
    addToHistoryEntry?: boolean
  ) => Promise<void>;

  endReading: () => Promise<void>;
  isSectionRead: (sectionId: string) => boolean;
  getReadSections: () => string[];
  loadReadSections: (documentPath: string) => Promise<void>;

  // Document progress tracking
  getDocumentCompletionPercentage: (
    documentPath: string,
    totalSections: number
  ) => Promise<number>;

  // Word count and time tracking
  getTotalWordsRead: (wordCountMap?: Record<string, number>) => Promise<number>;
  getTotalTimeSpent: () => Promise<number>;
  getTimeSpentOnDay: (date: Date) => Promise<number>;

  // Category-based analytics
  getReadingsByCategory: (category: string) => Promise<SectionReadingData[]>;
  getCategoryStats: () => Promise<Record<string, CategoryStats>>;

  // Reading speed analytics
  getReadingSpeed: () => Promise<number>;

  // Daily reading stats for charts
  getDailyReadingStats: (days: number) => Promise<
    Array<{
      date: string;
      timeSpent: number;
      wordsRead: number;
    }>
  >;
}

/**
 * Enhanced section store that supports category-based tracking and word counts
 */
export const useSectionStore = create<StoreState & StoreActions>((set, get) => {
  return {
    // Initial state
    readingState: {
      currentSectionId: null,
      sectionTitle: null,
      documentPath: null,
      category: null,
      wordCount: null,
      startTime: null,
      readSections: new Set<string>(),
    },
    categoryStats: {},
    isInitialized: false,
    loading: false,
    error: null,

    /**
     * Initialize the store and database
     */
    initialize: async () => {
      try {
        set({ loading: true });
        await sectionReadingService.initialize();

        // Load category stats
        const categoryStats = await get().getCategoryStats();

        set({
          isInitialized: true,
          categoryStats,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error initializing section store:", error);
        set({
          loading: false,
          error: parseError(error, "Failed to initialize section store"),
        });
      }
    },

    /**
     * Start reading a section with category and word count
     */
    startReading: async (
      documentPath,
      sectionId,
      category,
      wordCount,
      sectionTitle = "Untitled Section"
    ) => {
      try {
        const currentState = get().readingState;

        // End previous reading session if one exists
        if (currentState.currentSectionId && currentState.startTime) {
          const timeSpent = Date.now() - currentState.startTime;

          // Record the previous reading session
          if (
            currentState.documentPath &&
            currentState.category !== null &&
            currentState.wordCount !== null &&
            currentState.sectionTitle !== null
          ) {
            await sectionReadingService.recordSectionReading(
              currentState.documentPath,
              currentState.currentSectionId,
              currentState.sectionTitle,
              currentState.category,
              currentState.wordCount,
              timeSpent,
              true
            );
          }
        }

        // Start new reading session
        set((state) => {
          const newReadSections = new Set(state.readingState.readSections);
          newReadSections.add(sectionId);

          return {
            readingState: {
              currentSectionId: sectionId,
              sectionTitle: sectionTitle,
              documentPath,
              category,
              wordCount,
              startTime: Date.now(),
              readSections: newReadSections,
            },
            error: null,
          };
        });

        // Update category stats
        await get().getCategoryStats();
      } catch (error) {
        console.error("Error starting section reading:", error);
        set({ error: parseError(error, "Failed to start reading section") });
      }
    },

    /**
     * End the current reading session
     */
    endReading: async () => {
      try {
        const {
          currentSectionId,
          documentPath,
          category,
          wordCount,
          sectionTitle,
          startTime,
        } = get().readingState;

        if (
          currentSectionId &&
          documentPath &&
          category &&
          wordCount !== null &&
          sectionTitle &&
          startTime
        ) {
          const timeSpent = Date.now() - startTime;

          await sectionReadingService.recordSectionReading(
            documentPath,
            currentSectionId,
            sectionTitle,
            category,
            wordCount,
            timeSpent,
            true
          );

          // Reset current reading state
          set((state) => ({
            readingState: {
              ...state.readingState,
              currentSectionId: null,
              sectionTitle: null,
              documentPath: null,
              category: null,
              wordCount: null,
              startTime: null,
            },
          }));

          // Update category stats
          await get().getCategoryStats();
        }
      } catch (error) {
        console.error("Error ending section reading:", error);
        set({
          error: parseError(error, "Failed to end reading section"),
        });
      }
    },

    /**
     * Check if a section has been read
     */
    isSectionRead: (sectionId) => {
      return get().readingState.readSections.has(sectionId);
    },

    /**
     * Get all read sections
     */
    getReadSections: () => {
      return Array.from(get().readingState.readSections);
    },

    /**
     * Load read sections for a document
     */
    loadReadSections: async (documentPath) => {
      try {
        set({ loading: true });

        // Get read sections from the service
        const readSections = await sectionReadingService.getReadSections(
          documentPath
        );

        // Update state with read sections
        set((state) => ({
          readingState: {
            ...state.readingState,
            readSections,
          },
          loading: false,
          error: null,
        }));
      } catch (error) {
        console.error("Error loading read sections:", error);
        set({
          loading: false,
          error: parseError(error, "Failed to load read sections"),
        });
      }
    },

    /**
     * Get document completion percentage
     */
    getDocumentCompletionPercentage: async (documentPath, totalSections) => {
      try {
        return await sectionReadingService.getCompletionPercentage(
          documentPath,
          totalSections
        );
      } catch (error) {
        console.error("Error calculating completion percentage:", error);
        set({
          error: parseError(error, "Failed to calculate completion"),
        });
        return 0;
      }
    },

    /**
     * Calculate total words read across all documents
     */
    getTotalWordsRead: async (wordCountMap) => {
      try {
        const allReadings = await sectionReadingService.getAllReadings();
        return sectionWorkerManager.getTotalWordsRead(
          allReadings,
          wordCountMap
        );
      } catch (error) {
        console.error("Error calculating total words read:", error);
        set({
          error: parseError(error, "Failed to calculate total words read"),
        });
        return 0;
      }
    },

    /**
     * Calculate total time spent reading
     */
    getTotalTimeSpent: async () => {
      try {
        const allReadings = await sectionReadingService.getAllReadings();
        return allReadings.reduce(
          (total, reading) => total + reading.timeSpent,
          0
        );
      } catch (error) {
        console.error("Error calculating total time spent:", error);
        set({
          error: parseError(error, "Failed to calculate total time spent"),
        });
        return 0;
      }
    },

    /**
     * Calculate time spent reading on a specific day
     */
    getTimeSpentOnDay: async (date) => {
      try {
        const allReadings = await sectionReadingService.getAllReadings();
        return sectionWorkerManager.getTimeSpentOnDay(date, allReadings);
      } catch (error) {
        console.error("Error calculating time spent on day:", error);
        set({
          error: parseError(error, "Failed to calculate time spent on day"),
        });
        return 0;
      }
    },

    /**
     * Get readings by category
     */
    getReadingsByCategory: async (category) => {
      try {
        const allReadings = await sectionReadingService.getAllReadings();
        return allReadings.filter((reading) => reading.category === category);
      } catch (error) {
        console.error("Error getting readings by category:", error);
        set({
          error: parseError(error, "Failed to get readings by category"),
        });
        return [];
      }
    },

    /**
     * Get stats for all categories
     */
    getCategoryStats: async () => {
      try {
        const allReadings = await sectionReadingService.getAllReadings();
        const categoryMap = await sectionWorkerManager.getCategoryStats(
          allReadings
        );
        set({ categoryStats: categoryMap });
        return categoryMap;
      } catch (error) {
        console.error("Error getting category stats:", error);
        set({
          error: parseError(error, "Failed to get category stats"),
        });
        return {};
      }
    },

    /**
     * Calculate average reading speed (words per minute)
     */
    getReadingSpeed: async () => {
      try {
        const allReadings = await sectionReadingService.getAllReadings();
        return sectionWorkerManager.getReadingSpeed(allReadings);
      } catch (error) {
        console.error("Error calculating reading speed:", error);
        set({
          error: parseError(error, "Failed to calculate reading speed"),
        });
        return 0;
      }
    },

    /**
     * Get daily reading stats for charts
     */
    getDailyReadingStats: async (days = 7) => {
      try {
        const allReadings = await sectionReadingService.getAllReadings();
        return sectionWorkerManager.getDailyReadingStats(allReadings, days);
      } catch (error) {
        console.error("Error getting daily reading stats:", error);
        set({
          error: parseError(error, "Failed to get daily reading stats"),
        });
        return [];
      }
    },
  };
});
