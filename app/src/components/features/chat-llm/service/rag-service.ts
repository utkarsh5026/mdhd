import type { MarkdownSection } from "@/services/section/parsing";
import type { DocumentSource, LLMProvider, QueryContext } from "../types";
import { MDHDDocumentIndexer } from "./index-service";
import { MDHDLLMService } from "./llm-service";

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
    const sources = await this.indexer.searchSections(
      query,
      context.selectedSections,
      5
    );

    const sectionsUsed =
      context.selectedSections.length > 0
        ? this.indexer.getSectionsByIds(context.selectedSections)
        : this.indexer.getSectionsByIds(sources.map((s) => s.sectionId));

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
