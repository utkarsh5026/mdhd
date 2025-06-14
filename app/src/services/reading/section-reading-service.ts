import { databaseService } from "@/infrastructure/storage";

/**
 * Enhanced interface for section reading data stored in IndexedDB
 */
export type SectionReadingData = {
  id?: IDBValidKey; // Auto-generated unique ID
  documentPath: string; // Path to the document
  sectionId: string; // ID of the specific section
  sectionTitle: string; // Title of the section
  category: string; // Category of the document
  wordCount: number; // Number of words in the section
  timeSpent: number; // Time spent reading (milliseconds)
  lastReadAt: number; // Timestamp when section was read
  isComplete: boolean; // Whether section was completed
};

/**
 * Enhanced document stats with more metrics
 */
export type DocumentStats = {
  path: string; // Document path (primary key)
  category: string; // Document category
  completionPercentage: number; // % of document read
  totalTimeSpent: number; // Total time spent reading
  totalWordsRead: number; // Total words read
  lastReadAt: number; // When last read
  readCount: number; // Number of times accessed
  averageTimePerSection: number; // Avg time per section
};

/**
 * Enhanced SectionReadingService
 *
 * A dedicated service for tracking section reading activity with category support.
 * This service:
 * - Marks sections as read with category and word count information
 * - Records time spent on each section
 * - Provides category-based queries and analytics
 * - Stores this data in IndexedDB
 */
export class SectionReadingService {
  private static readonly SECTION_READINGS_STORE = "sectionReadings";
  private static readonly DOCUMENT_STATS_STORE = "documentStats";

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    try {
      await databaseService.initDatabase();
    } catch (error) {
      console.error("Error initializing SectionReadingService:", error);
      throw error;
    }
  }

  /**
   * Record a section reading session with enhanced data
   */
  public async recordSectionReading(
    documentPath: string,
    sectionId: string,
    sectionTitle: string,
    category: string,
    wordCount: number,
    timeSpent: number,
    isComplete: boolean = false
  ): Promise<void> {
    try {
      await databaseService.add(SectionReadingService.SECTION_READINGS_STORE, {
        documentPath,
        sectionId,
        sectionTitle,
        category,
        wordCount,
        timeSpent,
        lastReadAt: Date.now(),
        isComplete,
      });
      // Update document stats
      await this.updateDocumentStats(documentPath, category);
    } catch (error) {
      console.error("Error recording section reading:", error);
      throw error;
    }
  }

  /**
   * Update document-level statistics
   */
  private async updateDocumentStats(
    documentPath: string,
    category: string
  ): Promise<void> {
    try {
      // Get existing document stats
      const existingStatsArray = await databaseService.getByIndex<
        DocumentStats & { id: IDBValidKey }
      >(SectionReadingService.DOCUMENT_STATS_STORE, "path", documentPath);

      const existingStats =
        existingStatsArray.length > 0 ? existingStatsArray[0] : null;

      // Get all readings for this document
      const readings = await this.getDocumentSectionReadings(documentPath);

      // Calculate completion percentage
      const uniqueSectionIds = new Set(readings.map((r) => r.sectionId));
      const completedSectionIds = new Set(
        readings.filter((r) => r.isComplete).map((r) => r.sectionId)
      );

      const completionPercentage =
        uniqueSectionIds.size > 0
          ? (completedSectionIds.size / uniqueSectionIds.size) * 100
          : 0;

      // Calculate total time spent
      const totalTimeSpent = readings.reduce(
        (total, reading) => total + reading.timeSpent,
        0
      );

      // Calculate total words read
      const totalWordsRead = readings
        .filter((r) => r.isComplete)
        .reduce((total, reading) => total + (reading.wordCount || 0), 0);

      // Calculate average time per section
      const avgTimePerSection =
        readings.length > 0 ? totalTimeSpent / readings.length : 0;

      const lastReadAt = Date.now();

      if (existingStats) {
        // Update existing stats
        await databaseService.update(
          SectionReadingService.DOCUMENT_STATS_STORE,
          {
            ...existingStats,
            category,
            completionPercentage,
            totalTimeSpent,
            totalWordsRead,
            lastReadAt,
            readCount: existingStats.readCount + 1,
            averageTimePerSection: avgTimePerSection,
          }
        );
      } else {
        // Create new stats
        await databaseService.add(SectionReadingService.DOCUMENT_STATS_STORE, {
          path: documentPath,
          category,
          completionPercentage,
          totalTimeSpent,
          totalWordsRead,
          lastReadAt,
          readCount: 1,
          averageTimePerSection: avgTimePerSection,
        });
      }
    } catch (error) {
      console.error("Error updating document stats:", error);
      // Don't throw here to prevent blocking the main recording function
    }
  }

  /**
   * Get all section reading data for a document
   */
  public async getDocumentSectionReadings(
    documentPath: string
  ): Promise<SectionReadingData[]> {
    try {
      return await databaseService.getByIndex<SectionReadingData>(
        SectionReadingService.SECTION_READINGS_STORE,
        "documentPath",
        documentPath
      );
    } catch (error) {
      console.error("Error getting document section readings:", error);
      return [];
    }
  }

  /**
   * Get all readings by category
   */
  public async getReadingsByCategory(
    category: string
  ): Promise<SectionReadingData[]> {
    try {
      return await databaseService.getByIndex<SectionReadingData>(
        SectionReadingService.SECTION_READINGS_STORE,
        "category",
        category
      );
    } catch (error) {
      console.error("Error getting readings by category:", error);
      return [];
    }
  }

  /**
   * Get all section readings
   */
  public async getAllReadings(): Promise<SectionReadingData[]> {
    try {
      return await databaseService.getAll<SectionReadingData>(
        SectionReadingService.SECTION_READINGS_STORE
      );
    } catch (error) {
      console.error("Error getting all readings:", error);
      return [];
    }
  }

  /**
   * Get all read section IDs for a document
   */
  public async getReadSections(documentPath: string): Promise<Set<string>> {
    try {
      const readings = await this.getDocumentSectionReadings(documentPath);

      // Extract unique section IDs
      const readSections = new Set<string>();
      readings.forEach((reading) => {
        readSections.add(reading.sectionId);
      });

      return readSections;
    } catch (error) {
      console.error("Error getting read sections:", error);
      return new Set<string>();
    }
  }

  /**
   * Calculate document completion percentage
   */
  public async getCompletionPercentage(
    documentPath: string,
    totalSections: number
  ): Promise<number> {
    try {
      if (totalSections <= 0) return 0;

      const readSections = await this.getReadSections(documentPath);
      return Math.round((readSections.size / totalSections) * 100);
    } catch (error) {
      console.error("Error calculating completion percentage:", error);
      return 0;
    }
  }

  /**
   * Check if a specific section has been read
   */
  public async isSectionRead(
    documentPath: string,
    sectionId: string
  ): Promise<boolean> {
    try {
      const readings = await databaseService.getByIndex<SectionReadingData>(
        SectionReadingService.SECTION_READINGS_STORE,
        "sectionId",
        sectionId
      );

      // Check if any of the readings are for this document
      return readings.some((reading) => reading.documentPath === documentPath);
    } catch (error) {
      console.error("Error checking if section is read:", error);
      return false;
    }
  }

  /**
   * Clear all reading data for a document
   */
  public async clearDocumentReadings(documentPath: string): Promise<void> {
    try {
      const readings = await this.getDocumentSectionReadings(documentPath);

      // Delete each reading
      for (const reading of readings) {
        if (reading.id) {
          await databaseService.delete(
            SectionReadingService.SECTION_READINGS_STORE,
            reading.id
          );
        }
      }

      // Delete document stats
      const statsArray = await databaseService.getByIndex<
        DocumentStats & { id: IDBValidKey }
      >(SectionReadingService.DOCUMENT_STATS_STORE, "path", documentPath);

      if (statsArray.length > 0) {
        await databaseService.delete(
          SectionReadingService.DOCUMENT_STATS_STORE,
          statsArray[0].id
        );
      }
    } catch (error) {
      console.error("Error clearing document readings:", error);
      throw error;
    }
  }

  /**
   * Get time spent reading on a specific day
   */
  public async getTimeSpentOnDay(date: Date): Promise<number> {
    try {
      // Create date range for the specified day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all readings
      const allReadings = await this.getAllReadings();

      // Filter readings from the specified day and sum up time spent
      return allReadings
        .filter((reading) => {
          const readDate = new Date(reading.lastReadAt);
          return readDate >= startOfDay && readDate <= endOfDay;
        })
        .reduce((total, reading) => total + reading.timeSpent, 0);
    } catch (error) {
      console.error("Error calculating time spent on day:", error);
      return 0;
    }
  }
}

// Create and export a singleton instance
export const sectionReadingService = new SectionReadingService();
