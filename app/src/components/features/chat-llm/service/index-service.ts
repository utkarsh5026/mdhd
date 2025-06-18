import { Document } from "@langchain/core/documents";
import { VectorStore } from "@langchain/core/vectorstores";
import { Embeddings } from "@langchain/core/embeddings";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { MarkdownSection } from "@/services/section/parsing";
import type { DocumentSource } from "../types";

export class MDHDDocumentIndexer {
  private vectorStore: VectorStore | null = null;
  private embeddings: Embeddings;
  private documents: Map<string, MarkdownSection> = new Map();

  constructor(openAIApiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
      modelName: "text-embedding-3-small",
    });
  }

  async indexDocument(sections: MarkdownSection[]): Promise<void> {
    console.log(`Indexing ${sections.length} sections...`);

    this.documents.clear();
    sections.forEach((section) => {
      this.documents.set(section.id, section);
    });

    const documents = sections.map(
      (section, index) =>
        new Document({
          pageContent: `${section.title}\n\n${section.content}`,
          metadata: {
            sectionId: section.id,
            title: section.title,
            level: section.level,
            wordCount: section.wordCount,
            index,
          },
        })
    );

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
