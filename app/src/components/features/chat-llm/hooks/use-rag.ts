import { useState, useCallback, useRef, useEffect } from "react";
import { MDHDRAGService } from "../service/rag-service";
import type { MarkdownSection } from "@/services/section/parsing";
import type { QueryContext } from "../types";

export interface UseMDHDRAGProps {
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}

export const useMDHDRAG = (props: UseMDHDRAGProps) => {
  const [ragService, setRagService] = useState<MDHDRAGService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current && props.openAIApiKey) {
      initRef.current = true;
      try {
        const service = new MDHDRAGService({
          openai: props.openAIApiKey,
          anthropic: props.anthropicApiKey,
          google: props.googleApiKey,
        });
        setRagService(service);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize RAG service"
        );
      }
    }
  }, [props.openAIApiKey, props.anthropicApiKey, props.googleApiKey]);

  const indexDocument = useCallback(
    async (sections: MarkdownSection[]) => {
      if (!ragService) {
        throw new Error("RAG service not initialized");
      }

      setIsIndexing(true);
      setError(null);

      try {
        await ragService.initializeDocument(sections);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to index document"
        );
        throw err;
      } finally {
        setIsIndexing(false);
      }
    },
    [ragService]
  );

  const queryDocument = useCallback(
    async (query: string, context: QueryContext) => {
      if (!ragService) {
        throw new Error("RAG service not initialized");
      }

      return await ragService.queryDocument(query, context);
    },
    [ragService]
  );

  const getAvailableProviders = useCallback(() => {
    return ragService?.getAvailableProviders() || [];
  }, [ragService]);

  const getCurrentSections = useCallback(() => {
    return ragService?.getCurrentSections() || [];
  }, [ragService]);

  return {
    isInitialized,
    isIndexing,
    error,
    indexDocument,
    queryDocument,
    getAvailableProviders,
    getCurrentSections,
  };
};
