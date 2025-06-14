export type MonthName =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";

export const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type TimeRange = "week" | "month" | "quarter" | "year" | "all" | "today";

/**
 * 🕒 Formats a timestamp into a human-readable relative time
 *
 * Takes a timestamp and converts it into a friendly relative time string
 * like "Today", "Yesterday", or "2 weeks ago" to help users understand
 * when something happened without needing to process exact dates.
 */
export const formatRelativeTime = (timestamp: number | null) => {
  if (!timestamp) return "Never";

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * 📅 Gets the full name of a month from its number
 *
 * Converts a month number (0-11) into its full name like "January" or "December"
 * to make dates more readable and user-friendly in the interface.
 */
export const getMonthName = (month: number): MonthName => {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][month] as MonthName;
};

/**
 * 📊 Calculates the start date for different time ranges
 *
 * Determines the beginning date for time periods like week, month, quarter, or year
 * to help with filtering data and creating time-based visualizations.
 */
export const getStartDate = (range: TimeRange): Date => {
  const now = new Date();
  switch (range) {
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return weekStart;
    }
    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return monthStart;
    }
    case "quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
      return quarterStart;
    }
    case "year": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return yearStart;
    }
    case "all": {
      return new Date(0); // Beginning of time
    }
    case "today": {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(0, 0, 0, 0);
      return today;
    }
    default: {
      return new Date(0); // Beginning of time
    }
  }
};

/**
 * ⏱️ Creates a friendly "time ago" string from a timestamp
 *
 * Converts a timestamp into human-readable phrases like "just now",
 * "5 minutes ago", or "3 days ago" to give users an intuitive sense
 * of when something happened.
 */
export const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  // Less than a minute
  if (seconds < 60) {
    return "just now";
  }

  // Less than an hour
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  // Less than a day
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  // Less than a week
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  // Default to date
  return new Date(timestamp).toLocaleDateString();
};

/**
 * 🗓️ Creates a standardized date string for keys and IDs
 *
 * Formats a Date object into a consistent YYYY-MM-DD string
 * that can be used for sorting, grouping, or as unique identifiers
 * for date-based data.
 */
export const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * ⏲️ Formats milliseconds into a readable time string
 *
 * Converts raw milliseconds into a friendly time format like "01:30:45"
 * or "05:20" to display durations, reading times, or other time measurements
 * in a way that's instantly recognizable to users.
 */
export const formatTimeInMs = (ms: number, describe = true): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const formattedSeconds = String(seconds).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, "0");
    return describe
      ? `${formattedHours}h ${formattedMinutes}min ${formattedSeconds}sec`
      : `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else if (minutes > 0) {
    return describe
      ? `${formattedMinutes}min ${formattedSeconds}sec`
      : `${formattedMinutes}:${formattedSeconds}`;
  } else {
    return describe ? `${formattedSeconds}sec` : `${formattedSeconds}s`;
  }
};
