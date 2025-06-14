import { databaseService } from "@/infrastructure/storage";

export interface ReadingTodoItem {
  id: string;
  path: string;
  title: string;
  addedAt: number;
  completed: boolean;
  completedAt: number | null;
}

const STORE_NAME = "readingLists";

/**
 * 📥 Add a document to your reading list
 *
 * Saves a document to read later, but only if it's not already in your list.
 */
export async function addToReadingList(
  path: string,
  title: string
): Promise<boolean> {
  try {
    const existingItems = await databaseService.getByIndex<ReadingTodoItem>(
      STORE_NAME,
      "path",
      path
    );

    if (existingItems.length > 0) {
      return false;
    }

    const newItem: ReadingTodoItem = {
      id: crypto.randomUUID(),
      path,
      title,
      addedAt: Date.now(),
      completed: false,
      completedAt: null,
    };

    await databaseService.add(STORE_NAME, newItem);
    return true;
  } catch (error) {
    console.error("Error adding to reading list:", error);
    return false;
  }
}

/**
 * 📋 Get your entire reading list
 *
 * Fetches all the documents you've saved to read later.
 */
export async function getAllItems(): Promise<ReadingTodoItem[]> {
  try {
    return await databaseService.getAll<ReadingTodoItem>(STORE_NAME);
  } catch (error) {
    console.error("Error getting reading list items:", error);
    return [];
  }
}

/**
 * 🔍 Find a specific reading list item
 *
 * Locates a particular document in your reading list.
 */
export async function getItem(id: string): Promise<ReadingTodoItem | null> {
  try {
    const item = await databaseService.getByKey<ReadingTodoItem>(
      STORE_NAME,
      id
    );
    return item || null;
  } catch (error) {
    console.error("Error getting reading list item:", error);
    return null;
  }
}

/**
 * ✅ Mark an item as read (or unread)
 *
 * Toggles whether you've completed reading a document.
 * Also tracks when you finished reading it!
 */
export async function toggleCompletion(
  id: string
): Promise<ReadingTodoItem | null> {
  try {
    const item = await getItem(id);
    if (!item) {
      return null;
    }

    const updatedItem: ReadingTodoItem = {
      ...item,
      completed: !item.completed,
      completedAt: item.completed ? null : Date.now(),
    };

    await databaseService.update(STORE_NAME, updatedItem);
    return updatedItem;
  } catch (error) {
    console.error("Error toggling completion status:", error);
    return null;
  }
}

/**
 * 🗑️ Remove something from your reading list
 *
 * Deletes a document from your reading list when you no longer
 * want to keep track of it.
 */
export async function removeItem(id: string): Promise<boolean> {
  try {
    await databaseService.delete(STORE_NAME, id);
    return true;
  } catch (error) {
    console.error("Error removing item from reading list:", error);
    return false;
  }
}

/**
 * 🧹 Start fresh with an empty reading list
 *
 * Removes all items from your reading list in one go.
 */
export async function clearList(): Promise<void> {
  try {
    await databaseService.clearStore(STORE_NAME);
  } catch (error) {
    console.error("Error clearing reading list:", error);
    throw error;
  }
}

/**
 * 📊 See how you're doing with your reading
 *
 * Shows you statistics about your reading progress,
 * like how many items you've read and how many are left.
 */
export async function getCompletionStats(): Promise<{
  total: number;
  completed: number;
  pending: number;
  completionPercentage: number;
}> {
  try {
    const items = await getAllItems();
    const total = items.length;
    const completed = items.filter((item) => item.completed).length;
    const pending = total - completed;
    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      completionPercentage,
    };
  } catch (error) {
    console.error("Error calculating completion stats:", error);
    return {
      total: 0,
      completed: 0,
      pending: 0,
      completionPercentage: 0,
    };
  }
}
