import { useReadingStore } from "@/stores";
import { withErrorHandling } from "@/utils/functions/error";
import { useCallback, useMemo } from "react";

/**
 * 📚 A hook that organizes your reading list into neat categories!
 *
 * Helps you keep track of what you've finished and what's still on your
 * reading journey. Perfect for bookworms and knowledge seekers! 🤓✨
 */
const useReadingList = () => {
  const todoList = useReadingStore((state) => state.todoList);
  const status = useReadingStore((state) => state.status);
  const toggleTodoCompletion = useReadingStore(
    (state) => state.toggleTodoCompletion
  );
  const addToReadingList = useReadingStore((state) => state.addToReadingList);
  const removeFromReadingList = useReadingStore(
    (state) => state.removeFromReadingList
  );
  const clearReadingList = useReadingStore((state) => state.clearReadingList);
  const refreshReadingList = useReadingStore(
    (state) => state.refreshReadingList
  );
  /**
   * 🎉 All the books you've conquered! Good job, reader!
   */
  const completed = useMemo(() => {
    return todoList.filter((item) => item.completed);
  }, [todoList]);

  /**
   * 📖 Books waiting for your attention - the adventure continues!
   */
  const pending = useMemo(() => {
    return todoList.filter((item) => !item.completed);
  }, [todoList]);

  /**
   * 🎉 Toggle to-do completion
   */
  const toggleTodo = useCallback(
    async (id: string) => {
      return withErrorHandling(
        async () => await toggleTodoCompletion(id),
        null,
        {
          errorPrefix: "Failed to toggle todo completion",
        }
      )();
    },
    [toggleTodoCompletion]
  );

  const addToTodo = useCallback(
    async (path: string, title: string) => {
      return withErrorHandling(
        async () => await addToReadingList(path, title),
        null,
        {
          errorPrefix: "Failed to add to reading list",
        }
      )();
    },
    [addToReadingList]
  );

  const removeFromTodo = useCallback(
    async (id: string) => {
      return withErrorHandling(
        async () => await removeFromReadingList(id),
        null,
        {
          errorPrefix: "Failed to remove from reading list",
        }
      )();
    },
    [removeFromReadingList]
  );

  const clearTodo = useCallback(async () => {
    return withErrorHandling(async () => await clearReadingList(), null, {
      errorPrefix: "Failed to clear reading list",
    })();
  }, [clearReadingList]);

  const refreshTodo = useCallback(async () => {
    return withErrorHandling(async () => await refreshReadingList(), null, {
      errorPrefix: "Failed to refresh reading list",
    })();
  }, [refreshReadingList]);

  return {
    pending,
    completed,
    status,
    todoList,
    toggleTodo,
    addToTodo,
    removeFromTodo,
    clearTodo,
    refreshTodo,
  };
};

export default useReadingList;
