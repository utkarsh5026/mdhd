import { useHistoryStore } from "@/stores";
import { useCurrentDocument } from "@/hooks/document/use-current-document";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { union } from "@/utils/array";

const useDocumentReading = () => {
  const { sections, documentPath } = useCurrentDocument();
  const [sectionsReadSoFar, setSectionsReadSoFar] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const newSectionRead = useRef<Set<number>>(new Set());
  const alreadyReadSections = useRef<Set<number>>(new Set());

  const getDocumentHistory = useHistoryStore(
    (state) => state.getDocumentHistory
  );
  const markSectionsCompleted = useHistoryStore(
    (state) => state.markSectionsCompleted
  );

  /**
   * 📚 Load read sections when document changes
   */
  useEffect(() => {
    setLoading(true);
    const fetchReadSections = async () => {
      try {
        const documentHistory = await getDocumentHistory(documentPath);
        setLoading(false);
        if (!documentHistory) return;

        setSectionsReadSoFar(documentHistory.completedSectionIndices || []);
        alreadyReadSections.current = new Set(
          documentHistory.completedSectionIndices || []
        );
      } catch (error) {
        console.error("Error fetching read sections:", error);
        setLoading(false);
      }
    };

    fetchReadSections();
  }, [documentPath, getDocumentHistory]);

  /**
   * 📚 Start reading a section
   */
  const startSectionReading = useCallback(
    async (sectionIndex: number) => {
      if (!documentPath) return false;

      if (sectionIndex < 0 || sectionIndex >= sections.length) return false;

      await markSectionsCompleted(documentPath, [sectionIndex]);
      setSectionsReadSoFar((prev) => {
        return union(prev, [sectionIndex]);
      });
      newSectionRead.current.add(sectionIndex);
      return true;
    },
    [documentPath, markSectionsCompleted, sections]
  );

  /**
   * 📚 Get a section
   */
  const getSection = useCallback(
    (sectionIndex: number) => {
      if (sectionIndex < 0 || sectionIndex >= sections.length) return null;
      return sections[sectionIndex];
    },
    [sections]
  );

  /**
   * 📚 End reading
   */
  const endReading = useCallback(async () => {
    if (!documentPath) return;
    await markSectionsCompleted(documentPath, sectionsReadSoFar);
  }, [documentPath, sectionsReadSoFar, markSectionsCompleted]);

  /**
   * 📚 Get read sections
   */
  const readSections = useMemo(() => {
    return new Set(
      sections
        .filter((_section, index) => sectionsReadSoFar.includes(index))
        .map(({ id }) => id)
    );
  }, [sections, sectionsReadSoFar]);

  return {
    startSectionReading,
    endReading,
    getSection,
    sections,
    loading,
    readSections,
    newSectionRead: newSectionRead.current,
    alreadyReadSections: alreadyReadSections.current,
  };
};

export default useDocumentReading;
