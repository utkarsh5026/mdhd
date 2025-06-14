import {
  sectionWorkerManager,
  analyticsWorkerManager,
} from "@/infrastructure/workers";
import { SectionReadingData } from "@/services/reading/section-reading-service";
import { useCallback } from "react";
import { withErrorHandling } from "@/utils/functions/error";
import type { ReadingHistoryItem } from "@/services/reading/reading-history-service";
import type { FileMetadata } from "@/services/document";
import type { CategoryBreakdown } from "@/stores/analytics/category-store";

export type CategoryMetrics = {
  mostRead: CategoryBreakdown | null;
  leastRead: CategoryBreakdown | null;
  totalReadings: number;
  totalDocuments: number;
  categoriesWithReads: number;
  totalCategories: number;
  coveragePercentage: number;
  diversityScore: number;
  readingPattern: string;
};

/**
 * 📊 A hook for analyzing and visualizing reading habits by category
 *
 * This hook provides utilities to track and understand how users engage with
 * different content categories. It helps answer questions like "what topics
 * do I read most?" and "how diverse are my reading habits?" 🤓
 */
export const useCategoryMetrics = () => {
  /**
   * 📚 Calculates how many words a user has read in a specific category
   * Helps track reading volume across different topics! 📖
   */
  const getCategoryWordsRead = useCallback(
    async (sectionReadings: SectionReadingData[], category?: string) => {
      return withErrorHandling(
        async () =>
          sectionWorkerManager.getCategoryWordsRead(sectionReadings, category),
        0,
        {
          errorPrefix: "Failed to get words read for category:",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * ⏱️ Measures how much time a user has spent reading a specific category
   * Perfect for understanding where your time is going! ⌛
   */
  const getCategoryTimeSpent = useCallback(
    async (sectionReadings: SectionReadingData[], category?: string) => {
      return withErrorHandling(
        async () =>
          sectionWorkerManager.getCategoryTimeSpent(sectionReadings, category),
        0,
        {
          errorPrefix: "Failed to get time spent for category:",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 📈 Gathers comprehensive metrics about reading in a specific category
   * Combines reading speed, completion rates, and more into one neat package! 🎁
   */
  const getCategoryMetrics = useCallback(
    async (sectionReadings: SectionReadingData[], category?: string) => {
      return withErrorHandling(
        async () =>
          sectionWorkerManager.getCategoryMetrics(sectionReadings, category),
        {
          wordsRead: 0,
          timeSpent: 0,
          avgReadingSpeed: 0,
          completedSections: 0,
          totalSections: 0,
          completionPercentage: 0,
        },
        {
          errorPrefix: "Failed to get metrics for category:",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 🥧 Creates a breakdown of reading activity by category
   * Perfect for generating those beautiful pie charts! 🎨
   */
  const createCategoryBreakdown = useCallback(
    async (
      readingHistory: ReadingHistoryItem[],
      availableDocuments: FileMetadata[]
    ) => {
      return withErrorHandling(
        async () =>
          analyticsWorkerManager.calculateCategoryBreakdown(
            readingHistory,
            availableDocuments
          ),
        [],
        {
          errorPrefix: "Failed to create category breakdown:",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 🧠 Analyzes reading patterns across categories to provide insights
   * Discovers if you're a focused, diverse, or balanced reader! 🔍
   */
  const calculateCategoryMetrics = useCallback(
    (categoryBreakdown: CategoryBreakdown[]): CategoryMetrics | null => {
      if (categoryBreakdown.length === 0) return null;

      const findMostReadCategory = (categories: CategoryBreakdown[]) => {
        return [...categories].sort((a, b) => b.count - a.count)[0];
      };

      const findLeastReadCategory = (categories: CategoryBreakdown[]) => {
        const filtered = categories.filter((cat) => cat.count > 0);
        if (!filtered.length) return null;
        const sortedFiltered = [...filtered].sort((a, b) => a.count - b.count);
        return sortedFiltered[0];
      };

      const calculateReadStats = (categories: CategoryBreakdown[]) => {
        const totalReadings = categories.reduce(
          (sum, category) => sum + category.count,
          0
        );

        const totalDocuments = categories.reduce(
          (sum, category) => sum + category.categoryCount,
          0
        );

        const categoriesWithReads = categories.filter(
          (category) => category.count > 0
        ).length;

        const coveragePercentage = Math.round(
          (categoriesWithReads / categories.length) * 100
        );

        return {
          totalReadings,
          totalDocuments,
          categoriesWithReads,
          coveragePercentage,
        };
      };

      // Helper function to calculate diversity score
      const calculateDiversityScore = (
        categories: CategoryBreakdown[],
        totalReadings: number
      ) => {
        const equalShare = totalReadings / categories.length;
        const deviations = categories.map((cat) =>
          Math.abs(cat.count - equalShare)
        );
        const avgDeviation =
          deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;

        return Math.max(
          0,
          Math.min(
            100,
            Math.round(100 - (avgDeviation / (equalShare || 1)) * 50)
          )
        );
      };

      // Helper function to determine reading pattern
      const determineReadingPattern = (
        mostRead: CategoryBreakdown,
        totalReadings: number,
        diversityScore: number,
        categoriesWithReads: number,
        totalCategories: number
      ) => {
        if (mostRead && mostRead.count > totalReadings * 0.5) {
          return "Focused";
        } else if (diversityScore > 70) {
          return "Diverse";
        } else if (categoriesWithReads < totalCategories * 0.5) {
          return "Selective";
        }
        return "Balanced";
      };

      // Calculate all metrics
      const mostRead = findMostReadCategory(categoryBreakdown);
      const leastRead = findLeastReadCategory(categoryBreakdown);
      const {
        totalReadings,
        totalDocuments,
        categoriesWithReads,
        coveragePercentage,
      } = calculateReadStats(categoryBreakdown);
      const diversityScore = calculateDiversityScore(
        categoryBreakdown,
        totalReadings
      );
      const readingPattern = determineReadingPattern(
        mostRead,
        totalReadings,
        diversityScore,
        categoriesWithReads,
        categoryBreakdown.length
      );

      return {
        mostRead,
        leastRead,
        totalReadings,
        totalDocuments,
        categoriesWithReads,
        totalCategories: categoryBreakdown.length,
        coveragePercentage,
        diversityScore,
        readingPattern,
      };
    },
    []
  );
  return {
    getCategoryWordsRead,
    getCategoryTimeSpent,
    getCategoryMetrics,
    createCategoryBreakdown,
    calculateCategoryMetrics,
  };
};
