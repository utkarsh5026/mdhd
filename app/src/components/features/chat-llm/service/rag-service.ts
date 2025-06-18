// Installation requirements:
/*
npm install langchain @langchain/openai @langchain/anthropic @langchain/google-genai
npm install @langchain/community @langchain/core
npm install faiss-node  # For vector storage (optional, can use in-memory)
npm install pdf-parse    # If you want to support PDF uploads later
*/

import { Document } from "@langchain/core/documents";
import { VectorStore } from "@langchain/core/vectorstores";
import { Embeddings } from "@langchain/core/embeddings";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// LLM Providers
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Embeddings
import { OpenAIEmbeddings } from "@langchain/openai";

// Vector Store (using memory store for simplicity, can upgrade to FAISS)
import { MemoryVectorStore } from "langchain/vectorstores/memory";

// Types for MDHD integration
export interface MarkdownSection {
  id: string;
  title: string;
  content: string;
  level: number;
  wordCount: number;
  index: number; // Position in document
}

export interface LLMProvider {
  id: string;
  name: string;
  models: string[];
  icon: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  selectedSections?: string[]; // Section IDs used for this query
  model?: string;
  provider?: string;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  sectionId: string;
  sectionTitle: string;
  excerpt: string;
  relevanceScore: number;
}

export interface QueryContext {
  selectedSections: string[];
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
}

// 1. Document Indexing Service
export class MDHDDocumentIndexer {
  private vectorStore: VectorStore | null = null;
  private embeddings: Embeddings;
  private documents: Map<string, MarkdownSection> = new Map();

  constructor(openAIApiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
      modelName: "text-embedding-3-small", // Cost-effective and fast
    });
  }

  /**
   * Index all sections of a markdown document
   */
  async indexDocument(sections: MarkdownSection[]): Promise<void> {
    console.log(`Indexing ${sections.length} sections...`);

    // Store sections for quick lookup
    this.documents.clear();
    sections.forEach((section) => {
      this.documents.set(section.id, section);
    });

    // Create documents for vector storage
    const documents = sections.map(
      (section) =>
        new Document({
          pageContent: `${section.title}\n\n${section.content}`,
          metadata: {
            sectionId: section.id,
            title: section.title,
            level: section.level,
            wordCount: section.wordCount,
            index: section.index,
          },
        })
    );

    // Create or update vector store
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      this.embeddings
    );

    console.log("Document indexing completed");
  }

  /**
   * Search for relevant sections based on query
   */
  async searchSections(
    query: string,
    selectedSectionIds: string[],
    limit: number = 5
  ): Promise<DocumentSource[]> {
    if (!this.vectorStore) {
      throw new Error("Document not indexed yet");
    }

    // If specific sections are selected, filter to those
    let searchResults;
    if (selectedSectionIds.length > 0) {
      // Filter to selected sections
      const selectedDocs = await this.vectorStore.similaritySearchWithScore(
        query,
        limit * 2 // Get more results to filter
      );

      searchResults = selectedDocs
        .filter(([doc]) => selectedSectionIds.includes(doc.metadata.sectionId))
        .slice(0, limit);
    } else {
      // Search all sections
      searchResults = await this.vectorStore.similaritySearchWithScore(
        query,
        limit
      );
    }

    return searchResults.map(([doc, score]) => ({
      sectionId: doc.metadata.sectionId,
      sectionTitle: doc.metadata.title,
      excerpt: this.extractRelevantExcerpt(doc.pageContent, query),
      relevanceScore: 1 - score, // Convert distance to similarity
    }));
  }

  /**
   * Get sections by IDs
   */
  getSectionsByIds(sectionIds: string[]): MarkdownSection[] {
    return sectionIds
      .map((id) => this.documents.get(id))
      .filter(Boolean) as MarkdownSection[];
  }

  private extractRelevantExcerpt(content: string, query: string): string {
    const sentences = content.split(/[.!?]+/);
    const queryWords = query.toLowerCase().split(/\s+/);

    // Find sentence with most query word matches
    let bestSentence = sentences[0] || "";
    let maxMatches = 0;

    sentences.forEach((sentence) => {
      const matches = queryWords.filter((word) =>
        sentence.toLowerCase().includes(word)
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    });

    return (
      bestSentence.trim().slice(0, 200) +
      (bestSentence.length > 200 ? "..." : "")
    );
  }
}

// 2. Multi-Provider LLM Service
export class MDHDLLMService {
  private providers: Map<string, BaseLanguageModel> = new Map();
  private availableProviders: LLMProvider[] = [
    {
      id: "openai",
      name: "OpenAI",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
      icon: "🤖",
      description: "Powerful and versatile AI models",
    },
    {
      id: "anthropic",
      name: "Claude",
      models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
      icon: "🧠",
      description: "Excellent for analysis and reasoning",
    },
    {
      id: "google",
      name: "Gemini",
      models: ["gemini-1.5-pro", "gemini-1.5-flash"],
      icon: "✨",
      description: "Fast and efficient responses",
    },
  ];

  constructor(
    private apiKeys: {
      openai?: string;
      anthropic?: string;
      google?: string;
    }
  ) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize available providers based on API keys
    if (this.apiKeys.openai) {
      this.availableProviders
        .find((p) => p.id === "openai")
        ?.models.forEach((model) => {
          this.providers.set(
            `openai-${model}`,
            new ChatOpenAI({
              openAIApiKey: this.apiKeys.openai,
              modelName: model,
              temperature: 0.7,
            })
          );
        });
    }

    if (this.apiKeys.anthropic) {
      this.availableProviders
        .find((p) => p.id === "anthropic")
        ?.models.forEach((model) => {
          this.providers.set(
            `anthropic-${model}`,
            new ChatAnthropic({
              anthropicApiKey: this.apiKeys.anthropic,
              modelName: model,
              temperature: 0.7,
            })
          );
        });
    }

    if (this.apiKeys.google) {
      this.availableProviders
        .find((p) => p.id === "google")
        ?.models.forEach((model) => {
          this.providers.set(
            `google-${model}`,
            new ChatGoogleGenerativeAI({
              apiKey: this.apiKeys.google,
              model: model,
              temperature: 0.7,
            })
          );
        });
    }
  }

  getAvailableProviders(): LLMProvider[] {
    return this.availableProviders.filter((provider) => {
      const hasApiKey = this.apiKeys[provider.id as keyof typeof this.apiKeys];
      return hasApiKey;
    });
  }

  private getLLM(provider: string, model: string): BaseLanguageModel {
    const key = `${provider}-${model}`;
    const llm = this.providers.get(key);
    if (!llm) {
      throw new Error(`LLM not found: ${key}`);
    }
    return llm;
  }

  async queryWithContext(
    query: string,
    context: {
      sections: MarkdownSection[];
      sources: DocumentSource[];
      provider: string;
      model: string;
      temperature?: number;
    }
  ): Promise<string> {
    const llm = this.getLLM(context.provider, context.model);

    // Update temperature if provided
    // if (context.temperature !== undefined) {
    //   llm.setTemperature(context.temperature);
    // }

    // Build context from selected sections
    const contextText = context.sections
      .map((section) => `## ${section.title}\n${section.content}`)
      .join("\n\n");

    // Create prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an AI assistant helping users understand a markdown document. You have access to specific sections of the document.

DOCUMENT SECTIONS:
{context}

RELEVANT EXCERPTS:
{sources}

USER QUESTION: {question}

Please provide a helpful and accurate response based on the provided document sections. If the information isn't available in the given sections, clearly state that. Always reference specific sections when possible.

Response:`);

    // Build sources text
    const sourcesText = context.sources
      .map((source) => `- ${source.sectionTitle}: ${source.excerpt}`)
      .join("\n");

    // Create the chain
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    // Execute the chain
    const response = await chain.invoke({
      context: contextText,
      sources: sourcesText,
      question: query,
    });

    return response;
  }
}

// 3. Main RAG Service
export class MDHDRAGService {
  private indexer: MDHDDocumentIndexer;
  private llmService: MDHDLLMService;
  private currentSections: MarkdownSection[] = [];

  constructor(apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  }) {
    if (!apiKeys.openai) {
      throw new Error("OpenAI API key is required for embeddings");
    }

    this.indexer = new MDHDDocumentIndexer(apiKeys.openai);
    this.llmService = new MDHDLLMService(apiKeys);
  }

  async initializeDocument(sections: MarkdownSection[]): Promise<void> {
    this.currentSections = sections;
    await this.indexer.indexDocument(sections);
  }

  async queryDocument(
    query: string,
    context: QueryContext
  ): Promise<{
    response: string;
    sources: DocumentSource[];
    sectionsUsed: MarkdownSection[];
  }> {
    // Search for relevant sections
    const sources = await this.indexer.searchSections(
      query,
      context.selectedSections,
      5
    );

    // Get the actual section content
    const sectionsUsed =
      context.selectedSections.length > 0
        ? this.indexer.getSectionsByIds(context.selectedSections)
        : this.indexer.getSectionsByIds(sources.map((s) => s.sectionId));

    // Query the LLM with context
    const response = await this.llmService.queryWithContext(query, {
      sections: sectionsUsed,
      sources,
      provider: context.provider,
      model: context.model,
      temperature: context.temperature,
    });

    return {
      response,
      sources,
      sectionsUsed,
    };
  }

  getAvailableProviders(): LLMProvider[] {
    return this.llmService.getAvailableProviders();
  }

  getCurrentSections(): MarkdownSection[] {
    return this.currentSections;
  }
}

// 4. React Hook for MDHD Integration
import { useState, useCallback, useRef, useEffect } from "react";

export interface UseMDHDRAGProps {
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}

export function useMDHDRAG(props: UseMDHDRAGProps) {
  const [ragService, setRagService] = useState<MDHDRAGService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  // Initialize service
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
}
