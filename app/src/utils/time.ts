/**
 * Formats a Unix timestamp into a coarse, human-readable relative date string.
 *
 * Intended for displaying when a file was last accessed or modified — where day-level
 * granularity is sufficient. For sub-day precision (minutes, hours), use {@link formatTimeAgo}.
 *
 * @param timestamp - Unix timestamp in milliseconds, or `null` for an unknown date.
 * @returns A string like `"Today"`, `"Yesterday"`, `"3 days ago"`, `"2 weeks ago"`,
 *   `"4 months ago"`, `"1 years ago"`, or `"Never"` when `timestamp` is `null` or `0`.
 *
 * @example
 * formatRelativeTime(Date.now())              // → "Today"
 * formatRelativeTime(Date.now() - 86_400_000) // → "Yesterday"
 * formatRelativeTime(null)                    // → "Never"
 */
export const formatRelativeTime = (timestamp: number | null) => {
  if (!timestamp) return 'Never';

  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Formats a Unix timestamp into a fine-grained, human-readable elapsed-time string.
 *
 * Provides minute- and hour-level precision for recent events, making it suitable for
 * activity timestamps such as "last synced" indicators. Falls back to the locale date
 * string once the timestamp is more than 7 days old.
 *
 * @param timestamp - Unix timestamp in milliseconds.
 * @returns A string like `"just now"`, `"5 minutes ago"`, `"2 hours ago"`, `"1 day ago"`,
 *   or a locale-formatted date string (e.g. `"3/10/2026"`) for timestamps older than 7 days.
 *
 * @example
 * formatTimeAgo(Date.now() - 30_000)       // → "just now"
 * formatTimeAgo(Date.now() - 300_000)      // → "5 minutes ago"
 * formatTimeAgo(Date.now() - 3_600_000)    // → "1 hour ago"
 * formatTimeAgo(Date.now() - 86_400_000)   // → "1 day ago"
 */
export const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  return new Date(timestamp).toLocaleDateString();
};
