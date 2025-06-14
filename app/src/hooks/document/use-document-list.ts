import { Category } from "@/services/document";
import { useDocumentStore } from "@/stores";
import { useCallback, useEffect, useMemo } from "react";

/**
 * 📚 A hook that organizes your reading list into neat categories!
 *
 * Helps you keep track of what you've finished and what's still on your
 * reading journey. Perfect for bookworms and knowledge seekers! 🤓✨
 */
const useDocumentList = () => {
  const fileMap = useDocumentStore((state) => state.fileMap);
  const contentIndex = useDocumentStore((state) => state.contentIndex);
  const getFileBreadcrumbs = useDocumentStore(
    (state) => state.getFileBreadcrumbs
  );
  const docs = useDocumentStore((state) => state.docs);

  useEffect(() => {
    console.log("Document list updated", docs);
  }, [docs]);

  const documents = useMemo(() => {
    return Object.values(fileMap);
  }, [fileMap]);

  /**
   * 📚 A hook that counts the total number of files in a category!
   *
   * Helps you keep track of what you've finished and what's still on your
   * reading journey. Perfect for bookworms and knowledge seekers! 🤓✨
   */
  const countTotalFiles = useCallback((category: Category): number => {
    const countFiles = (category: Category): number => {
      let count = category.files?.length ?? 0;
      if (category.categories) {
        category.categories.forEach((sub) => {
          count += countFiles(sub);
        });
      }
      return count;
    };

    return countFiles(category);
  }, []);

  return {
    contentIndex,
    getFileBreadcrumbs,
    countTotalFiles,
    documents,
    fileMap,
    docs,
  };
};

export default useDocumentList;
