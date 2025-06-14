import type { ReadingHistoryItem } from "@/services/reading/reading-history-service";
import { formatDateKey, type TimeRange } from "@/utils/time";

/**
 * Sorting options for history items
 */
export type HistorySortOption = "recent" | "oldest" | "timeSpent" | "wordsRead";

/**
 * Filter options for history
 */
export interface HistoryFilterOptions {
  category?: string;
  timePeriod?: TimeRange;
  sortBy?: HistorySortOption;
  limit?: number;
  searchTerm?: string;
}

/**
 * Get reading history filtered by category
 * @param history Full reading history
 * @param category Category to filter by
 * @returns Filtered history items
 */
export function getHistoryByCategory(
  history: ReadingHistoryItem[],
  category: string
): ReadingHistoryItem[] {
  if (!category || category === "all") {
    return history;
  }

  return history.filter((item) => {
    const itemCategory = item.path.split("/")[0] || "uncategorized";
    return itemCategory.toLowerCase() === category.toLowerCase();
  });
}

/**
 * Get history items for a specific time period
 * @param history Full reading history
 * @param period Time period to filter by
 * @returns Filtered history items
 */
export function getHistoryByTimePeriod(
  history: ReadingHistoryItem[],
  period: TimeRange
): ReadingHistoryItem[] {
  if (!period || period === "all") {
    return history;
  }

  const now = Date.now();
  let cutoffTime: number;

  switch (period) {
    case "today":
      cutoffTime = now - 24 * 60 * 60 * 1000; // 1 day ago
      break;
    case "week":
      cutoffTime = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      break;
    case "month":
      cutoffTime = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
      break;
    case "year":
      cutoffTime = now - 365 * 24 * 60 * 60 * 1000; // 365 days ago
      break;
    default:
      return history;
  }

  return history.filter((item) => item.lastReadAt >= cutoffTime);
}

/**
 * Sort history items based on specified criteria
 * @param history History items to sort
 * @param sortOption Sort option to apply
 * @returns Sorted history items
 */
export function sortHistory(
  history: ReadingHistoryItem[],
  sortOption: HistorySortOption = "recent"
): ReadingHistoryItem[] {
  const sortedHistory = [...history];

  switch (sortOption) {
    case "recent":
      return sortedHistory.sort((a, b) => b.lastReadAt - a.lastReadAt);
    case "oldest":
      return sortedHistory.sort((a, b) => a.lastReadAt - b.lastReadAt);
    case "timeSpent":
      return sortedHistory.sort((a, b) => b.timeSpent - a.timeSpent);
    case "wordsRead":
      return sortedHistory.sort((a, b) => b.wordsRead - a.wordsRead);
    default:
      return sortedHistory;
  }
}

/**
 * Search history items by title or path
 * @param history History items to search
 * @param searchTerm Term to search for
 * @returns Filtered history items
 */
export function searchHistory(
  history: ReadingHistoryItem[],
  searchTerm: string
): ReadingHistoryItem[] {
  if (!searchTerm) {
    return history;
  }

  const normalizedTerm = searchTerm.toLowerCase();
  return history.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedTerm) ||
      item.path.toLowerCase().includes(normalizedTerm)
  );
}

/**
 * Apply all filters and sorting to history items
 * @param history Full reading history
 * @param options Filter and sort options
 * @returns Filtered and sorted history items
 */
export const filterHistory = (
  history: ReadingHistoryItem[],
  options: HistoryFilterOptions = {}
): ReadingHistoryItem[] => {
  let filteredHistory = [...history];

  if (options.category) {
    filteredHistory = getHistoryByCategory(filteredHistory, options.category);
  }

  if (options.timePeriod) {
    filteredHistory = getHistoryByTimePeriod(
      filteredHistory,
      options.timePeriod
    );
  }

  if (options.searchTerm) {
    filteredHistory = searchHistory(filteredHistory, options.searchTerm);
  }
  filteredHistory = sortHistory(filteredHistory, options.sortBy ?? "recent");

  // Apply limit
  if (options.limit && options.limit > 0) {
    filteredHistory = filteredHistory.slice(0, options.limit);
  }

  return filteredHistory;
};

/**
 * Get the latest read items from history
 * @param history Full reading history
 * @param limit Maximum number of items to return
 * @returns Most recently read items
 */
export function getLatestReadItems(
  history: ReadingHistoryItem[],
  limit: number = 5
): ReadingHistoryItem[] {
  return sortHistory(history, "recent").slice(0, limit);
}

/**
 * Get history items with the most words read
 * @param history Full reading history
 * @param limit Maximum number of items to return
 * @returns Items with the most words read
 */
export function getMostWordsReadItems(
  history: ReadingHistoryItem[],
  limit: number = 5
): ReadingHistoryItem[] {
  return sortHistory(history, "wordsRead").slice(0, limit);
}

/**
 * Group history items by date
 * @param history History items to group
 * @returns History items grouped by date
 */
export function groupHistoryByDate(
  history: ReadingHistoryItem[]
): Record<string, ReadingHistoryItem[]> {
  const grouped: Record<string, ReadingHistoryItem[]> = {};

  history.forEach((item) => {
    const date = new Date(item.lastReadAt);
    const dateKey = formatDateKey(date);

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(item);
  });

  // Sort each group by most recent first
  Object.keys(grouped).forEach((key) => {
    grouped[key] = sortHistory(grouped[key], "recent");
  });

  return grouped;
}

/**
 * Group history items by category
 * @param history History items to group
 * @returns History items grouped by category
 */
export function groupHistoryByCategory(
  history: ReadingHistoryItem[]
): Record<string, ReadingHistoryItem[]> {
  const grouped: Record<string, ReadingHistoryItem[]> = {};

  history.forEach((item) => {
    const category = item.path.split("/")[0] || "uncategorized";

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(item);
  });

  // Sort each group by most recent first
  Object.keys(grouped).forEach((key) => {
    grouped[key] = sortHistory(grouped[key], "recent");
  });

  return grouped;
}

/**
 * Get reading history for a specific date range
 * @param history Full reading history
 * @param startDate Start date of range
 * @param endDate End date of range
 * @returns Filtered history items
 */
export function getHistoryByDateRange(
  history: ReadingHistoryItem[],
  startDate: Date,
  endDate: Date
): ReadingHistoryItem[] {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return history.filter(
    (item) => item.lastReadAt >= startTime && item.lastReadAt <= endTime
  );
}

/**
 * Calculate reading statistics for a given period
 * @param history History items to analyze
 * @param period Time period to filter by
 * @returns Reading statistics
 */
export function getReadingStatsForPeriod(
  history: ReadingHistoryItem[],
  period: TimeRange
): {
  totalItems: number;
  totalTimeSpent: number;
  totalWordsRead: number;
  averageTimePerItem: number;
  averageWordsPerItem: number;
} {
  const filteredHistory = getHistoryByTimePeriod(history, period);

  const totalItems = filteredHistory.length;
  const totalTimeSpent = filteredHistory.reduce(
    (sum, item) => sum + item.timeSpent,
    0
  );
  const totalWordsRead = filteredHistory.reduce(
    (sum, item) => sum + item.wordsRead,
    0
  );

  const averageTimePerItem = totalItems > 0 ? totalTimeSpent / totalItems : 0;
  const averageWordsPerItem = totalItems > 0 ? totalWordsRead / totalItems : 0;

  return {
    totalItems,
    totalTimeSpent,
    totalWordsRead,
    averageTimePerItem,
    averageWordsPerItem,
  };
}
