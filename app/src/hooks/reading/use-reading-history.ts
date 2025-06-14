import { useCallback, useEffect, useState } from "react";
import * as readingHistoryService from "@/services/reading/reading-history-service";
import { useHistoryStore } from "@/stores/reading/history-store";
import { estimateWordsRead } from "@/services/analytics/word-count-estimation";
import { ReadingHistoryItem } from "@/services/reading/reading-history-service";
import { readingWorkerManager } from "@/infrastructure/workers";
import { HistoryFilterOptions } from "@/services/reading/reading-history-filter";

/**
 * useReadingHistory Hook
 *
 * A custom hook that provides an interface for tracking and managing reading history,
 * with special focus on time tracking for reading sessions.
 *
 * Features:
 * - Add documents to reading history
 * - Update reading time for existing history items
 * - Mark sections as completed
 * - Retrieve document reading history
 */
export function useReadingHistory() {
  const [categoryMap, setCategoryMap] = useState<
    Record<string, ReadingHistoryItem[]>
  >({});

  const history = useHistoryStore((state) => state.readingHistory);

  useEffect(() => {
    history.sort((a, b) => b.lastReadAt - a.lastReadAt);
  }, [history]);

  const addToReadingHistory = useHistoryStore(
    (state) => state.addToReadingHistory
  );

  const refreshReadingHistory = useHistoryStore(
    (state) => state.refreshReadingHistory
  );

  const markSectionsCompletedStore = useHistoryStore(
    (state) => state.markSectionsCompleted
  );

  const getDocumentHistoryStore = useHistoryStore(
    (state) => state.getDocumentHistory
  );

  /**
   * Add a document to the reading history
   */
  const addToHistory = useCallback(
    async (path: string, title: string, sectionIndices?: number[]) => {
      try {
        const result = await addToReadingHistory(path, title, sectionIndices);
        return result;
      } catch (error) {
        console.error("Error adding to reading history:", error);
        return null;
      }
    },
    [addToReadingHistory]
  );

  /**
   * Update the reading time for a document in the history
   * Also calculates estimated words read based on the time spent
   */
  const updateReadingTime = useCallback(
    async (path: string, title: string, timeSpent: number) => {
      try {
        const historyItem = await readingHistoryService.getDocumentHistory(
          path
        );

        const wordsRead = estimateWordsRead(timeSpent);

        if (historyItem) {
          // Update existing history item
          const updatedItem = {
            ...historyItem,
            lastReadAt: Date.now(),
            timeSpent: historyItem.timeSpent + timeSpent,
            wordsRead: historyItem.wordsRead + wordsRead,
          };

          await readingHistoryService.updateHistoryItem(updatedItem);
        } else {
          // Create new history item if it doesn't exist
          await readingHistoryService.addToReadingHistory(
            path,
            title,
            undefined,
            timeSpent,
            wordsRead
          );
        }

        // Refresh history store to reflect changes
        await refreshReadingHistory();

        return true;
      } catch (error) {
        console.error("Error updating reading time:", error);
        return false;
      }
    },
    [refreshReadingHistory]
  );

  /**
   * Mark sections as completed for a document
   */
  const markSectionsCompleted = useCallback(
    async (path: string, sectionIndices: number[]) => {
      try {
        const result = await markSectionsCompletedStore(path, sectionIndices);
        return result;
      } catch (error) {
        console.error("Error marking sections as completed:", error);
        return false;
      }
    },
    [markSectionsCompletedStore]
  );

  /**
   * Get reading history for a document
   */
  const getDocumentHistory = useCallback(
    async (path: string) => {
      try {
        const history = await getDocumentHistoryStore(path);
        return history;
      } catch (error) {
        console.error("Error getting document history:", error);
        return null;
      }
    },
    [getDocumentHistoryStore]
  );

  /**
   * 📚 Creates a category map for your reading history
   */
  useEffect(() => {
    readingWorkerManager.createCategoryMap(history).then((categoryMap) => {
      setCategoryMap(categoryMap);
    });
  }, [history]);

  /**
   * 🔍 Helps you find specific reading memories!
   */
  const filterHistory = useCallback(
    async (filter: HistoryFilterOptions) => {
      const filteredHistory = await readingWorkerManager.filterHistory(
        history,
        filter
      );
      return filteredHistory;
    },
    [history]
  );

  const refreshHistory = useCallback(async () => {
    await refreshReadingHistory();
  }, [refreshReadingHistory]);

  return {
    addToHistory,
    updateReadingTime,
    markSectionsCompleted,
    getDocumentHistory,
    categoryMap,
    filterHistory,
    history,
    refreshHistory,
  };
}
