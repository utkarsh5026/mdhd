import { analyticsWorkerManager } from "@/infrastructure/workers";
import type {
  DailyActivity,
  WeeklyActivity,
  HourlyActivity,
} from "@/services/analytics/activity-analyzer";
import {
  getDailyActivityMetrics as getDailyActivityMetricsService,
  getWeeklyActivityMetrics as getWeeklyActivityMetricsService,
  getReadingByHourMetrics as getReadingByHourMetricsService,
} from "@/services/analytics/activity-analyzer";

import type { ReadingHistoryItem } from "@/services/reading/reading-history-service";
import { withErrorHandling } from "@/utils/functions/error";
import { useCallback } from "react";

/**
 * 📊 Activity Metrics Hook
 *
 * This hook provides comprehensive analytics about your reading habits,
 * including daily, weekly, and hourly activity patterns.
 *
 **/
export const useActivityMetrics = () => {
  /**
   * ⏰ Analyzes what hours of the day you love to read!
   * Shows your reading patterns across a 24-hour cycle.
   */
  const calculateTotalReadingByHour = useCallback(
    (history: ReadingHistoryItem[]) => {
      return withErrorHandling(
        () => analyticsWorkerManager.calculateReadingByHour(history),
        [],
        {
          errorPrefix: "Failed to calculate reading by hour",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 🗓️ Discovers which days of the week you read the most!
   * Perfect for seeing if you're a weekend reader or weekday warrior.
   */
  const calculateTotalWeeklyActivity = useCallback(
    (history: ReadingHistoryItem[]) => {
      return withErrorHandling(
        () => analyticsWorkerManager.calculateWeeklyActivity(history),
        [],
        {
          errorPrefix: "Failed to calculate weekly activity",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 📆 Tracks your reading throughout the month!
   * See if you prefer reading at the beginning, middle, or end of the month.
   */
  const calculateTotalDailyActivity = useCallback(
    (history: ReadingHistoryItem[]) => {
      return withErrorHandling(
        async () => {
          const dailyActivity =
            await analyticsWorkerManager.calculateDailyActivity(history);
          return dailyActivity;
        },
        [],
        {
          errorPrefix: "Failed to calculate daily activity",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 📊 Gets the most and least active days of the week!
   * Perfect for seeing if you're a weekend reader or weekday warrior.
   */
  const getDailyActivityMetrics = useCallback(
    (dailyActivity: DailyActivity[]) => {
      return withErrorHandling(
        async () => getDailyActivityMetricsService(dailyActivity),
        {
          mostActiveDay: {
            day: 0,
            count: 0,
          },
          leastActiveDay: {
            day: 0,
            count: 0,
          },
        },
        {
          errorPrefix: "Failed to get daily activity metrics",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 📊 Gets the most and least active days of the week!
   * Perfect for seeing if you're a weekend reader or weekday warrior.
   */
  const getWeeklyActivityMetrics = useCallback(
    (
      weeklyActivity: WeeklyActivity[]
    ): Promise<{
      mostActiveDay: WeeklyActivity;
      leastActiveDay: WeeklyActivity;
    }> => {
      return withErrorHandling(
        async () => getWeeklyActivityMetricsService(weeklyActivity),
        {
          mostActiveDay: {
            day: "Sunday",
            count: 0,
          } as WeeklyActivity,
          leastActiveDay: {
            day: "Sunday",
            count: 0,
          } as WeeklyActivity,
        },
        {
          errorPrefix: "Failed to get weekly activity metrics",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 📊 Gets the most and least active hours of the day!
   * Perfect for seeing if you're a morning or night owl.
   */
  const getReadingByHourMetrics = useCallback(
    (readingByHour: HourlyActivity[]) => {
      return withErrorHandling(
        async () => getReadingByHourMetricsService(readingByHour),
        {
          mostActiveHour: {
            hour: 0,
            count: 0,
          },
          leastActiveHour: {
            hour: 0,
            count: 0,
          },
        },
        {
          errorPrefix: "Failed to get reading by hour metrics",
          logError: true,
        }
      )();
    },
    []
  );

  return {
    calculateTotalReadingByHour,
    calculateTotalWeeklyActivity,
    calculateTotalDailyActivity,
    getDailyActivityMetrics,
    getWeeklyActivityMetrics,
    getReadingByHourMetrics,
  };
};

export const useWeekilyActivityMetrcis = () => {
  /**
   * 📊 Gets the most and least active days of the week!
   * Perfect for seeing if you're a weekend reader or weekday warrior.
   */
  const generateWeeklyActivityInsights = useCallback(
    (weeklyActivity: WeeklyActivity[]) => {
      if (!weeklyActivity || weeklyActivity.length === 0) {
        return {
          dayData: [],
          peakDay: null,
          lowestDay: null,
          average: 0,
          totalCount: 0,
          weekdayAvg: 0,
          weekendAvg: 0,
          weekdayTotal: 0,
          weekendTotal: 0,
          preferredType: null,
          maxValue: 0,
        };
      }

      // Calculate peak and lowest days
      const peakDay = [...weeklyActivity].sort((a, b) => b.count - a.count)[0];
      const activeDays = weeklyActivity.filter((day) => day.count > 0);
      const lowestDay =
        activeDays.length > 0
          ? [...activeDays].sort((a, b) => a.count - b.count)[0]
          : null;

      // Calculate totals and averages
      const totalCount = weeklyActivity.reduce(
        (sum, day) => sum + day.count,
        0
      );
      const average = totalCount / 7;

      // Calculate weekday vs weekend averages
      const weekdays = weeklyActivity.filter(
        (day) => !["Saturday", "Sunday"].includes(day.day)
      );
      const weekends = weeklyActivity.filter((day) =>
        ["Saturday", "Sunday"].includes(day.day)
      );

      const weekdayTotal = weekdays.reduce((sum, day) => sum + day.count, 0);
      const weekendTotal = weekends.reduce((sum, day) => sum + day.count, 0);

      const weekdayAvg = weekdayTotal / 5;
      const weekendAvg = weekendTotal / 2;

      let preferredType;
      if (weekdayAvg > weekendAvg) {
        preferredType = "weekday";
      } else if (weekendAvg > weekdayAvg) {
        preferredType = "weekend";
      } else {
        preferredType = "even";
      }

      // Enhance the data with additional properties
      const dayData = weeklyActivity.map((day) => {
        // Check if it's a weekend
        const isWeekend = ["Saturday", "Sunday"].includes(day.day);

        // Calculate relative metrics
        const comparedToAvg =
          day.count > 0 ? Math.round((day.count / average - 1) * 100) : 0;

        // Determine if it's the peak day
        const isPeak = day.day === peakDay.day;

        // Add day type and short day name
        return {
          ...day,
          shortDay: day.day.slice(0, 3),
          isWeekend,
          isPeak,
          comparedToAvg,
        };
      });

      // Find maximum value for chart scaling
      const maxValue = Math.max(...dayData.map((day) => day.count));

      return {
        dayData,
        peakDay,
        lowestDay,
        average,
        totalCount,
        weekdayAvg,
        weekendAvg,
        weekdayTotal,
        weekendTotal,
        preferredType,
        maxValue,
      };
    },
    []
  );

  /**
   * 🗓️ Discovers which days of the week you read the most!
   * Perfect for seeing if you're a weekend reader or weekday warrior.
   */
  const calculateTotalWeeklyActivity = useCallback(
    (history: ReadingHistoryItem[]) => {
      return withErrorHandling(
        () => analyticsWorkerManager.calculateWeeklyActivity(history),
        [],
        {
          errorPrefix: "Failed to calculate weekly activity",
          logError: true,
        }
      )();
    },
    []
  );

  /**
   * 📊 Gets the most and least active days of the week!
   * Perfect for seeing if you're a weekend reader or weekday warrior.
   */
  const getWeeklyActivityMetrics = useCallback(
    (
      weeklyActivity: WeeklyActivity[]
    ): Promise<{
      mostActiveDay: WeeklyActivity;
      leastActiveDay: WeeklyActivity;
    }> => {
      return withErrorHandling(
        async () => getWeeklyActivityMetricsService(weeklyActivity),
        {
          mostActiveDay: {
            day: "Sunday",
            count: 0,
          } as WeeklyActivity,
          leastActiveDay: {
            day: "Sunday",
            count: 0,
          } as WeeklyActivity,
        },
        {
          errorPrefix: "Failed to get weekly activity metrics",
          logError: true,
        }
      )();
    },
    []
  );

  return {
    generateWeeklyActivityInsights,
    calculateTotalWeeklyActivity,
    getWeeklyActivityMetrics,
  };
};
