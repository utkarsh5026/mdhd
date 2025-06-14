import { fromSnakeToTitleCase } from "@/utils/string";
import { databaseService } from "@/infrastructure/storage";
import { estimateWordsRead } from "@/services/analytics/word-count-estimation";
import { union } from "@/utils/array";

const STORE_NAME = "readingHistory";

/**
 * 📚 Reading History Service
 *
 * Tracks and manages your reading journey across documents.
 * Remembers what you've read, when you read it, and how much time you spent!
 */
export interface ReadingHistoryItem {
  id?: number;
  path: string;
  title: string;
  lastReadAt: number;
  readCount: number;
  timeSpent: number;
  wordsRead: number;
  completedSectionIndices: number[]; // Array of section indices that have been completed
}

type DbReadingHistoryItem = ReadingHistoryItem & { id: IDBValidKey };

/**
 * Update an existing reading history item
 *
 * This function allows updating any properties of a reading history item,
 * particularly useful for updating time spent and words read after a reading session.
 */
export async function updateHistoryItem(
  item: ReadingHistoryItem
): Promise<boolean> {
  try {
    const cleanedPath = _cleanPath(item.path);
    const existingItems = await databaseService.getByIndex<
      ReadingHistoryItem & { id: IDBValidKey }
    >(STORE_NAME, "path", cleanedPath);

    if (existingItems.length === 0) {
      console.warn(`No history item found for path: ${cleanedPath}`);
      return false;
    }

    const existingItem = existingItems[0];
    const updatedItem = {
      ...existingItem,
      ...item,
      path: cleanedPath,
    };

    await databaseService.update(STORE_NAME, updatedItem);
    return true;
  } catch (error) {
    console.error("Error updating reading history item:", error);
    return false;
  }
}

/**
 * Enhanced version of addToReadingHistory that accepts timeSpent and wordsRead parameters
 *
 * This overloaded function allows directly specifying the time spent and words read
 * when adding or updating a reading history item.
 */
export async function addToReadingHistory(
  path: string,
  title: string,
  completedSectionIndices?: number[],
  timeSpent?: number,
  wordsRead?: number
): Promise<ReadingHistoryItem> {
  try {
    const cleanedPath = _cleanPath(path);
    const existingEntries = await databaseService.getByIndex<
      ReadingHistoryItem & { id: IDBValidKey }
    >(STORE_NAME, "path", cleanedPath);

    const existingEntry =
      existingEntries.length > 0 ? existingEntries[0] : null;

    const now = Date.now();
    const sessionTimeSpent = timeSpent ?? 0;
    const sessionWordsRead = wordsRead ?? estimateWordsRead(sessionTimeSpent);

    if (existingEntry) {
      const updatedEntry: ReadingHistoryItem = {
        ...existingEntry,
        lastReadAt: now,
        readCount: existingEntry.readCount + 1,
        timeSpent: existingEntry.timeSpent + sessionTimeSpent,
        wordsRead: existingEntry.wordsRead + sessionWordsRead,
        completedSectionIndices: union(
          existingEntry.completedSectionIndices,
          completedSectionIndices ?? []
        ),
      };

      await databaseService.update(
        STORE_NAME,
        updatedEntry as {
          id: IDBValidKey;
        }
      );
      return updatedEntry;
    } else {
      const newEntry: ReadingHistoryItem = {
        path: cleanedPath,
        title,
        lastReadAt: now,
        readCount: 1,
        timeSpent: sessionTimeSpent,
        wordsRead: sessionWordsRead,
        completedSectionIndices: completedSectionIndices ?? [],
      };

      const id = await databaseService.add(STORE_NAME, newEntry);
      return { ...newEntry, id: id as number };
    }
  } catch (error) {
    console.error("Error adding to reading history:", error);
    throw error;
  }
}

/**
 * 📋 Get all reading history items
 *
 * Fetches your complete reading history so you can see
 * everything you've been learning about!
 */
export async function getAllHistory(): Promise<ReadingHistoryItem[]> {
  try {
    const history = await databaseService.getAll<ReadingHistoryItem>(
      STORE_NAME
    );
    return history.map((item) => ({
      ...item,
      title: fromSnakeToTitleCase(
        item.path.split("/").pop()?.replace(".md", "") ?? ""
      ),
    }));
  } catch (error) {
    console.error("Error getting reading history:", error);
    return [];
  }
}

/**
 * 🧹 Clear all reading history
 *
 * Wipes your reading slate clean! Sometimes you just
 * want to start fresh with tracking what you've read.
 */
export async function clearHistory(): Promise<void> {
  try {
    await databaseService.clearStore(STORE_NAME);
  } catch (error) {
    console.error("Error clearing reading history:", error);
    throw error;
  }
}

/**
 * 🔍 Get history item for a specific document
 *
 * Checks if you've read a particular document before
 * and retrieves your reading stats for it!
 */
export async function getDocumentHistory(
  path: string
): Promise<ReadingHistoryItem | null> {
  try {
    const cleanedPath = _cleanPath(path);
    const items = await databaseService.getByIndex<ReadingHistoryItem>(
      STORE_NAME,
      "path",
      cleanedPath
    );

    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error("Error getting document history:", error);
    return null;
  }
}

/**
 * Mark a section as completed for a document
 */
export async function markSectionsCompleted(
  path: string,
  sectionIndices: number[]
): Promise<boolean> {
  try {
    const entry = await getDocumentHistory(path);

    if (!entry) {
      return false;
    }

    const { completedSectionIndices } = entry;

    const updatedEntry: ReadingHistoryItem = {
      ...entry,
      lastReadAt: Date.now(),
      completedSectionIndices: union(completedSectionIndices, sectionIndices),
    };

    await databaseService.update(
      STORE_NAME,
      updatedEntry as { id: IDBValidKey }
    );
    return true;
  } catch (error) {
    console.error("Error marking section as completed:", error);
    return false;
  }
}

/**
 * Check if a section has been completed
 */
export async function isSectionCompleted(
  path: string,
  sectionIndex: number
): Promise<boolean> {
  try {
    const documentHistory = await getDocumentHistory(path);
    if (!documentHistory?.completedSectionIndices) return false;

    return documentHistory.completedSectionIndices.includes(sectionIndex);
  } catch (error) {
    console.error("Error checking if section is completed:", error);
    return false;
  }
}

/**
 * Get all completed sections for a document
 */
export async function getCompletedSections(path: string): Promise<number[]> {
  try {
    const documentHistory = await getDocumentHistory(path);
    return documentHistory?.completedSectionIndices || [];
  } catch (error) {
    console.error("Error getting completed sections:", error);
    return [];
  }
}

/**
 * Calculate document completion percentage
 */
export async function getDocumentCompletionPercentage(
  path: string,
  totalSections: number
): Promise<number> {
  try {
    if (totalSections <= 0) return 0;

    const completedSections = await getCompletedSections(path);
    return Math.round((completedSections.length / totalSections) * 100);
  } catch (error) {
    console.error("Error calculating completion percentage:", error);
    return 0;
  }
}

/**
 * Clean the path to ensure it doesnot ends with ".md"
 */
const _cleanPath = (path: string) => {
  return path.toLowerCase().endsWith(".md") ? path.replace(".md", "") : path;
};

/**
 * Clean duplicate history items, keeping only the most recent for each path
 *
 * This function:
 * 1. Loads all history items from IndexedDB
 * 2. Groups them by path
 * 3. For each path, keeps only the most recent item (based on lastReadAt)
 * 4. Removes all duplicates from the database
 * 5. Returns statistics about the operation
 */
export async function cleanDuplicateHistory(): Promise<{
  removedCount: number;
  totalCount: number;
}> {
  try {
    const allItems = await databaseService.getAll<DbReadingHistoryItem>(
      STORE_NAME
    );

    /**
     * Group reading history items by their normalized path
     */
    function groupItemsByPath(): Map<string, DbReadingHistoryItem[]> {
      const itemsByPath = new Map<string, DbReadingHistoryItem[]>();

      allItems.forEach((item) => {
        const normalizedPath = item.path.toLowerCase();
        if (!itemsByPath.has(normalizedPath))
          itemsByPath.set(normalizedPath, []);
        itemsByPath.get(normalizedPath)?.push(item);
      });

      return itemsByPath;
    }

    /**
     * Merge multiple history items for the same path into one
     */
    function mergeItemsIntoOne(
      items: DbReadingHistoryItem[]
    ): DbReadingHistoryItem {
      items.sort((a, b) => b.lastReadAt - a.lastReadAt);
      const mostRecent = { ...items[0] };

      const allCompletedSections = new Set<number>();
      items.forEach((item) => {
        item.completedSectionIndices?.forEach((idx) =>
          allCompletedSections.add(idx)
        );
      });

      mostRecent.completedSectionIndices = [...allCompletedSections];
      return mostRecent;
    }

    /**
     * Select which items to keep, merging duplicate entries
     */
    function selectItemsToKeep(
      itemsByPath: Map<string, DbReadingHistoryItem[]>
    ): DbReadingHistoryItem[] {
      const itemsToKeep: DbReadingHistoryItem[] = [];

      for (const [, items] of itemsByPath.entries()) {
        if (items.length <= 1) {
          itemsToKeep.push(items[0]);
        } else {
          itemsToKeep.push(mergeItemsIntoOne(items));
        }
      }

      return itemsToKeep;
    }

    /**
     * Persist the cleaned items to the database
     */
    async function persistCleanedItems(
      itemsToKeep: (ReadingHistoryItem & { id: IDBValidKey })[]
    ): Promise<void> {
      await databaseService.clearStore(STORE_NAME);

      for (const item of itemsToKeep) {
        const cleanItem = { ...item } as Partial<typeof item>;
        delete cleanItem.id;
        await databaseService.add(STORE_NAME, cleanItem);
      }
    }

    const itemsByPath = groupItemsByPath();
    const itemsToKeep = selectItemsToKeep(itemsByPath);

    await persistCleanedItems(itemsToKeep);

    const removedCount = allItems.length - itemsToKeep.length;

    return {
      removedCount,
      totalCount: itemsToKeep.length,
    };
  } catch (error) {
    console.error("Error cleaning reading history:", error);
    throw error;
  }
}
