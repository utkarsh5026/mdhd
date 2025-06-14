import { useSectionStore, useHistoryStore } from "@/stores";
import { useState, useEffect } from "react";
import useDocumentList from "@/hooks/document/use-document-list";

const useGlobalMetrics = () => {
  const getTotalWordsRead = useSectionStore((state) => state.getTotalWordsRead);
  const getTotalTimeSpent = useSectionStore((state) => state.getTotalTimeSpent);
  const streak = useHistoryStore((state) => state.streak);
  const readingHistory = useHistoryStore((state) => state.readingHistory);
  const { fileMap } = useDocumentList();
  const [totalWordsRead, setTotalWordsRead] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const wordsRead = await getTotalWordsRead();
      const timeSpent = await getTotalTimeSpent();
      setTotalWordsRead(wordsRead);
      setTotalTimeSpent(timeSpent);
    }
    fetchData();
  }, [getTotalWordsRead, getTotalTimeSpent]);

  return {
    totalWordsRead,
    totalTimeSpent,
    streak,
    documents: {
      read: readingHistory.length,
      available: Object.keys(fileMap).length,
    },
  };
};

export default useGlobalMetrics;
