import React, { createContext, useContext, useEffect, useState } from "react";
import { MDHDRAGService } from "../service/rag-service";
import type { MarkdownSection } from "@/services/section/parsing";

interface RAGContextType {
  ragService: MDHDRAGService | null;
  isInitialized: boolean;
  isIndexing: boolean;
  error: string | null;
  indexDocument: (sections: MarkdownSection[]) => Promise<void>;
  queryDocument: (query: string, context: any) => Promise<any>;
  getAvailableProviders: () => any[];
  getCurrentSections: () => MarkdownSection[];
}

const RAGContext = createContext<RAGContextType | null>(null);

export const RAGProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ragService, setRagService] = useState<MDHDRAGService | null>(null);
  const [isInitialized, setIsInitialized] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeRAG = async () => {
      try {
        const apiKeys = {
          openai: "sk-proj-1234567890",
          anthropic: "sk-proj-1234567890",
          google: "sk-proj-1234567890",
        };

        if (!apiKeys.openai) {
          setError("OpenAI API key is required for embeddings");
          return;
        }

        const service = new MDHDRAGService(apiKeys);
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
    };

    initializeRAG();
  }, []);

  const indexDocument = async (sections: MarkdownSection[]) => {
    if (!ragService) throw new Error("RAG service not initialized");

    setIsIndexing(true);
    setError(null);

    try {
      await ragService.initializeDocument(sections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to index document");
      throw err;
    } finally {
      setIsIndexing(false);
    }
  };

  const queryDocument = async (query: string, context: any) => {
    if (!ragService) throw new Error("RAG service not initialized");
    return await ragService.queryDocument(query, context);
  };

  const getAvailableProviders = () => {
    return ragService?.getAvailableProviders() || [];
  };

  const getCurrentSections = () => {
    return ragService?.getCurrentSections() || [];
  };

  return (
    <RAGContext.Provider
      value={{
        ragService,
        isInitialized,
        isIndexing,
        error,
        indexDocument,
        queryDocument,
        getAvailableProviders,
        getCurrentSections,
      }}
    >
      {children}
    </RAGContext.Provider>
  );
};

export const useRAG = () => {
  const context = useContext(RAGContext);
  if (!context) {
    throw new Error("useRAG must be used within a RAGProvider");
  }
  return context;
};
