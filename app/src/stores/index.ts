import { useReadingStore } from "./reading/reading-store";
import { useDocumentStore } from "./document/document-store";
import { useHistoryStore } from "./reading/history-store";
import { useCategoryStore } from "./analytics/category-store";
import { useActivityStore } from "./analytics/activity-store";
import { useHeatmapStore } from "./analytics/heatmap-store";
import { useEffect, useState } from "react";
import { useSectionStore } from "./reading/section-store";
import { useCurrentDocumentStore } from "./document/current-document-store";
import { databaseService } from "@/infrastructure/storage";

/**
 * 🚀 Initializes all stores when the app starts
 * Gets everything ready to go!
 */
const useInit = () => {
  const [loading, setLoading] = useState(true);
  const readingInit = useReadingStore((state) => state.initialize);
  const documentInit = useDocumentStore((state) => state.initialize);
  const historyInit = useHistoryStore((state) => state.initialize);
  const categoryInit = useCategoryStore((state) => state.initialize);
  const activityInit = useActivityStore((state) => state.initialize);
  const sectionInit = useSectionStore((state) => state.initialize);
  useEffect(() => {
    const init = async () => {
      await databaseService.initDatabase();
      await readingInit();
      await documentInit();
      await historyInit();
      await categoryInit();
      await activityInit();
      await sectionInit();
    };
    init().then(() => {
      setLoading(false);
    });
  }, [
    readingInit,
    documentInit,
    historyInit,
    categoryInit,
    activityInit,
    sectionInit,
  ]);

  return loading;
};

export {
  useReadingStore,
  useDocumentStore,
  useHistoryStore,
  useInit,
  useActivityStore,
  useHeatmapStore,
  useSectionStore,
  useCurrentDocumentStore,
  useCategoryStore,
};
