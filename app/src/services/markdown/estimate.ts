const AVERAGE_READING_SPEED_WPM = 250; // Words per minute

/**
 * Estimate the time needed to read a document
 * @param wordCount Number of words in the document
 * @param readingSpeed Optional custom reading speed in words per minute
 * @returns Estimated reading time in milliseconds
 */
export function estimateReadingTime(
  wordCount: number,
  readingSpeed = AVERAGE_READING_SPEED_WPM
): number {
  // Calculate minutes needed to read
  const minutes = Math.max(1, wordCount / readingSpeed);

  // Convert to milliseconds
  return minutes * 60 * 1000;
}

/**
 * Estimate reading progress based on time spent
 * @param wordCount Total word count of document
 * @param timeSpentMs Time spent reading in milliseconds
 * @param readingSpeed Optional custom reading speed in words per minute
 * @returns Percentage of document read (0-100)
 */
export function estimateReadingProgress(
  wordCount: number,
  timeSpentMs: number,
  readingSpeed = AVERAGE_READING_SPEED_WPM
): number {
  if (wordCount <= 0 || timeSpentMs <= 0) {
    return 0;
  }

  // Calculate total expected time to read
  const totalReadingTimeMs = estimateReadingTime(wordCount, readingSpeed);

  // Calculate percentage read
  let percentageRead = (timeSpentMs / totalReadingTimeMs) * 100;

  // Cap at 100%
  percentageRead = Math.min(percentageRead, 100);

  return Math.round(percentageRead);
}

/**
 * Estimate words read based on time spent
 * @param timeSpentMs Time spent reading in milliseconds
 * @param readingSpeed Optional custom reading speed in words per minute
 * @returns Estimated words read
 */
export function estimateWordsRead(
  timeSpentMs: number,
  readingSpeed = AVERAGE_READING_SPEED_WPM
): number {
  if (timeSpentMs <= 0) {
    return 0;
  }

  // Convert milliseconds to minutes
  const minutes = timeSpentMs / (60 * 1000);

  // Calculate words read
  return Math.floor(minutes * readingSpeed);
}
