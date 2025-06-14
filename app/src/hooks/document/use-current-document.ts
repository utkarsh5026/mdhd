import { useCurrentDocumentStore } from "@/stores";
import { useCallback, useMemo } from "react";
import { getFilenameFromPath } from "@/services/document";

export const useCurrentDocument = () => {
  const markdown = useCurrentDocumentStore((state) => state.markdown);
  const sections = useCurrentDocumentStore((state) => state.sections);
  const documentPath = useCurrentDocumentStore((state) => state.docPath);
  const category = useCurrentDocumentStore((state) => state.category);
  const load = useCurrentDocumentStore((state) => state.load);
  const loading = useCurrentDocumentStore((state) => state.loading);
  const error = useCurrentDocumentStore((state) => state.error);
  const metrics = useCurrentDocumentStore((state) => state.metrics);

  const documentTitle = useMemo(() => {
    return getFilenameFromPath(documentPath);
  }, [documentPath]);

  const loadedDocumentForUrl = useCallback(
    (url: string) => {
      load(url);
    },
    [load]
  );

  return {
    markdown,
    sections,
    documentPath,
    category,
    documentTitle,
    loadedDocumentForUrl,
    loading,
    error,
    metrics,
  };
};
