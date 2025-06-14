import { create } from "zustand";
import * as readingListService from "@/services/reading/reading-list-service";
import { parseError } from "@/utils/error";
import type { ReadingTodoItem } from "@/services/reading/reading-list-service";

export type ReadingStatus = {
  pendingCount: number;
  completedCount: number;
  completionPercentage: number;
  totalCount: number;
};

type State = {
  todoList: ReadingTodoItem[];
  isLoading: boolean;
  error: string | null;
  status: ReadingStatus;
};

type Actions = {
  addToReadingList: (path: string, title: string) => Promise<boolean>;
  removeFromReadingList: (id: string) => Promise<boolean>;
  toggleTodoCompletion: (id: string) => Promise<ReadingTodoItem | null>;
  clearReadingList: () => Promise<void>;
  getCompletionStats: () => Promise<ReadingStatus>;
  refreshReadingList: () => Promise<void>;
  initialize: () => Promise<void>;
};

/**
 * 📚 Reading Store - A central hub for managing your reading list!
 *
 * This store keeps track of all your reading items, their completion status,
 * and provides helpful statistics about your reading progress. ✨
 *
 * 🔖 Use it to add new documents to read later, mark items as complete,
 * and get insights into your reading habits! Perfect for staying organized
 * and motivated in your documentation journey. 📈
 */
export const useReadingStore = create<State & Actions>((set, get) => ({
  todoList: [],
  isLoading: true,
  error: null,
  status: {
    pendingCount: 0,
    completedCount: 0,
    completionPercentage: 0,
    totalCount: 0,
  },

  /**
   * 📝 Adds a new document to your reading list!
   * Keep track of interesting docs you want to read later. ✅
   */
  addToReadingList: async (path, title) => {
    try {
      const success = await readingListService.addToReadingList(path, title);

      if (success) {
        await get().refreshReadingList();
      }

      return success;
    } catch (error) {
      console.error("Error adding to reading list:", error);
      set({
        error: parseError(error, "Failed to add to reading list"),
      });
      return false;
    }
  },

  /**
   * 🗑️ Removes an item from your reading list when you no longer need it!
   * Keeps your list tidy and focused on what matters.
   */
  removeFromReadingList: async (id) => {
    try {
      const success = await readingListService.removeItem(id);

      if (success) {
        await get().refreshReadingList();
      }

      return success;
    } catch (error) {
      console.error("Error removing from reading list:", error);
      set({
        error: parseError(error, "Failed to remove from reading list"),
      });
      return false;
    }
  },

  /**
   * ✅ Toggles an item between completed and pending status!
   * Track your progress and feel accomplished as you complete readings. 🎉
   */
  toggleTodoCompletion: async (id) => {
    try {
      const updatedItem = await readingListService.toggleCompletion(id);

      if (updatedItem) {
        await get().refreshReadingList();
      }

      return updatedItem;
    } catch (error) {
      console.error("Error toggling completion status:", error);
      set({
        error: parseError(error, "Failed to update item status"),
      });
      return null;
    }
  },

  /**
   * 🧹 Clears your entire reading list with confirmation!
   * Sometimes a fresh start is just what you need. 🌱
   */
  clearReadingList: async () => {
    if (confirm("Are you sure you want to clear your reading list?")) {
      try {
        await readingListService.clearList();
        set({
          todoList: [],
          status: {
            pendingCount: 0,
            completedCount: 0,
            completionPercentage: 0,
            totalCount: 0,
          },
          error: null,
        });
      } catch (error) {
        console.error("Error clearing reading list:", error);
        set({
          error: parseError(error, "Failed to clear reading list"),
        });
      }
    }
  },

  /**
   * 📊 Gets statistics about your reading progress!
   * See how much you've accomplished and what's still ahead. 🏆
   */
  getCompletionStats: async () => {
    try {
      const stats = await readingListService.getCompletionStats();
      return {
        pendingCount: stats.pending,
        completedCount: stats.completed,
        completionPercentage: stats.completionPercentage,
        totalCount: stats.total,
      };
    } catch (error) {
      console.error("Error getting completion stats:", error);
      set({
        error: parseError(error, "Failed to get completion statistics"),
      });
      return {
        pendingCount: 0,
        completedCount: 0,
        completionPercentage: 0,
        totalCount: 0,
      };
    }
  },

  /**
   * 🔄 Refreshes your reading list with the latest data!
   * Keeps everything up-to-date and in sync. ✨
   */
  refreshReadingList: async () => {
    set({ isLoading: true });
    try {
      const items = await readingListService.getAllItems();

      const completedCount = items.filter((item) => item.completed).length;
      const totalCount = items.length;
      const pendingCount = totalCount - completedCount;
      const completionPercentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      set({
        todoList: items,
        status: {
          pendingCount,
          completedCount,
          completionPercentage,
          totalCount,
        },
        error: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error refreshing reading list:", error);
      set({
        error: parseError(error, "Failed to refresh reading list"),
        isLoading: false,
      });
    }
  },

  /**
   * 🚀 Initializes the reading list when the app starts!
   * Gets everything ready for your reading adventures. 📚
   */
  initialize: async () => {
    set({ isLoading: true });
    try {
      await get().refreshReadingList();
    } catch (error) {
      console.error("Error initializing reading list:", error);
      set({
        error: parseError(error, "Failed to initialize reading list"),
        isLoading: false,
      });
    }
  },
}));
