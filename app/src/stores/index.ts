import { useReadingStore } from "./reading/reading-store";
import { useHistoryStore } from "./reading/history-store";
import { useEffect, useState } from "react";
import { useSectionStore } from "./reading/section-store";

/**
 * 🚀 Initializes all stores when the app starts
 * Gets everything ready to go!
 */
const useInit = () => {
  const [loading, setLoading] = useState(true);
  const readingInit = useReadingStore((state) => state.initialize);
  const historyInit = useHistoryStore((state) => state.initialize);
  const sectionInit = useSectionStore((state) => state.initialize);
  useEffect(() => {
    const init = async () => {
      await readingInit();
      await historyInit();
      await sectionInit();
    };
    init().then(() => {
      setLoading(false);
    });
  }, [readingInit, historyInit, sectionInit]);

  return loading;
};

export { useReadingStore, useHistoryStore, useInit, useSectionStore };
