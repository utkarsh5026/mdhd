import { create } from "zustand";
import type { ReadingHistoryItem } from "@/services/reading/reading-history-service";
import { parseError } from "@/utils/error";
import * as readingHistoryService from "@/services/reading/reading-history-service";
import { readingWorkerManager } from "@/infrastructure/workers/";

type Streak = {
  longestStreak: number;
  currentStreak: number;
};

type HistoryStats = {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
};

type State = {
  readingHistory: ReadingHistoryItem[];
  isLoading: boolean;
  error: string | null;
  streak: Streak;
  statsCache: Record<string, HistoryStats>;
};

type Actions = {
  addToReadingHistory: (
    path: string,
    title: string,
    sectionIndices?: number[]
  ) => Promise<ReadingHistoryItem | null>;
  clearReadingHistory: () => Promise<void>;
  getDocumentHistory: (path: string) => Promise<ReadingHistoryItem | null>;
  refreshReadingHistory: () => Promise<void>;
  initialize: () => Promise<void>;
  calculateStreak: (readingHistory: ReadingHistoryItem[]) => Streak;
  getHistoryStats: (category: string) => HistoryStats;
  markSectionsCompleted: (
    path: string,
    sectionIndices: number[]
  ) => Promise<boolean>;
  cleanDuplicateHistory: () => Promise<{
    removedCount: number;
    totalCount: number;
  }>;
};

/**
 * 📚 History Store
 *
 * A central store for tracking and managing reading history.
 *
 * ✨ Features:
 * - Tracks documents you've read
 * - Records time spent on each document
 * - Maintains completion percentages
 * - Syncs with analytics services
 *
 * 🔍 Use this store when you need to access or modify reading history!
 */
export const useHistoryStore = create<State & Actions>((set, get) => ({
  readingHistory: [],
  isLoading: true,
  error: null,
  streak: {
    longestStreak: 0,
    currentStreak: 0,
  },
  statsCache: {},

  /**
   * 📝 Add a document to reading history
   * Tracks what you've been reading!
   */
  addToReadingHistory: async (path, title, sectionIndices) => {
    try {
      const updatedItem = await readingHistoryService.addToReadingHistory(
        path,
        title,
        sectionIndices
      );

      get().refreshReadingHistory();

      return updatedItem;
    } catch (error) {
      console.error("Error adding to reading history:", error);
      set({
        error: parseError(error, "Failed to add to reading history"),
      });
      return null;
    }
  },

  /**
   * 🧹 Clear reading history
   * Fresh start with a clean slate!
   */
  clearReadingHistory: async () => {
    if (confirm("Are you sure you want to clear your reading history?")) {
      try {
        await readingHistoryService.clearHistory();
        set({ readingHistory: [], error: null });
      } catch (error) {
        console.error("Error clearing reading history:", error);
        set({
          error: parseError(error, "Failed to clear reading history"),
        });
      }
    }
  },

  /**
   * 🔍 Get history for a specific document
   * Find out when you read something!
   */
  getDocumentHistory: async (path) => {
    try {
      const historyItem = await readingHistoryService.getDocumentHistory(path);
      return historyItem;
    } catch (error) {
      console.error("Error getting document history:", error);
      set({
        error: parseError(error, "Failed to get document history"),
      });
      return null;
    }
  },

  /**
   * 🔄 Refresh reading history
   * Get the latest reading data!
   */
  refreshReadingHistory: async () => {
    set({ isLoading: true });
    try {
      await get().cleanDuplicateHistory();
      const history = await readingHistoryService.getAllHistory();
      set({ readingHistory: history, error: null, isLoading: false });
    } catch (error) {
      console.error("Error refreshing reading history:", error);
      set({
        error: parseError(error, "Failed to refresh reading history"),
        isLoading: false,
      });
    }
  },

  /**
   * 🔍 Calculate reading streak
   * Get your reading streak!
   */
  calculateStreak: (readingHistory: ReadingHistoryItem[]) => {
    /**
     * 📅 Create a date key
     * Get the date in a format that can be used to calculate streaks
     */
    const createDateKey = (date: Date): string => {
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    };

    /**
     * 📅 Get unique reading days
     * Get the unique reading days from the reading history
     */
    const getUniqueReadingDays = (history: ReadingHistoryItem[]): string[] => {
      const readingDays = new Set<string>();
      history.forEach((item) => {
        if (item.lastReadAt) {
          const date = new Date(item.lastReadAt);
          const dateKey = createDateKey(date);
          readingDays.add(dateKey);
        }
      });
      return Array.from(readingDays).sort((a, b) => a.localeCompare(b));
    };

    /**
     * 📅 Calculate current streak
     * Get the current streak of reading days
     */
    const calculateCurrentStreak = (readingDays: string[]): number => {
      const today = new Date();
      const todayString = createDateKey(today);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = createDateKey(yesterday);

      const hasToday = readingDays.includes(todayString);
      const hasYesterday = readingDays.includes(yesterdayString);

      let currentStreak = 0;

      if (hasToday || hasYesterday) {
        currentStreak = 1;

        const startDate = hasToday ? yesterday : new Date(yesterday);
        startDate.setDate(startDate.getDate() - 1);

        const checkDate = startDate;

        while (true) {
          const checkDateKey = createDateKey(checkDate);
          if (!readingDays.includes(checkDateKey)) break;

          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      return currentStreak;
    };

    /**
     * 📅 Calculate longest streak
     * Get the longest streak of reading days
     */
    const calculateLongestStreak = (readingDays: string[]): number => {
      let longestStreak = currentStreak;
      let tempStreak = 1;

      for (let i = 1; i < readingDays.length; i++) {
        const current = new Date(readingDays[i]);
        const prev = new Date(readingDays[i - 1]);

        const diffTime = current.getTime() - prev.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }

      return longestStreak;
    };

    const readingDays = getUniqueReadingDays(readingHistory);

    if (readingDays.length === 0)
      return {
        currentStreak: 0,
        longestStreak: 0,
      };

    const sortedDays = [...readingDays].sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    const currentStreak = calculateCurrentStreak(sortedDays);
    const longestStreak = calculateLongestStreak(sortedDays);

    return { currentStreak, longestStreak };
  },

  /**
   * 🚀 Initialize the store
   * Gets everything ready to go!
   */
  initialize: async () => {
    set({ isLoading: true });
    try {
      await get().cleanDuplicateHistory();
      const history = await readingHistoryService.getAllHistory();
      const streak = get().calculateStreak(history);
      set({ readingHistory: history, streak, error: null, isLoading: false });
    } catch (error) {
      console.error("Error loading reading history:", error);
      set({
        error: parseError(error, "Failed to load reading history"),
        isLoading: false,
      });
    }
  },

  /**
   * 📊 Get history stats for a specific category
   * Get the stats for a specific category
   */
  getHistoryStats: (category: string) => {
    const cachedStats = get().statsCache[category];
    if (cachedStats) return cachedStats;

    let history: ReadingHistoryItem[] = [];

    if (category !== "all") {
      history = get().readingHistory.filter((item) =>
        item.path.split("/").includes(category)
      );
    } else {
      history = get().readingHistory;
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const stats = {
      today: history.filter((item) => now - item.lastReadAt < oneDay).length,
      thisWeek: history.filter((item) => now - item.lastReadAt < oneWeek)
        .length,
      thisMonth: history.filter((item) => now - item.lastReadAt < oneMonth)
        .length,
      total: history.length,
    };

    set({ statsCache: { ...get().statsCache, [category]: stats } });
    return stats;
  },

  markSectionsCompleted: async (path, sectionIndices) => {
    return await readingHistoryService.markSectionsCompleted(
      path,
      sectionIndices
    );
  },

  cleanDuplicateHistory: async () => {
    return await readingWorkerManager.cleanDuplicateHistory();
  },
}));
