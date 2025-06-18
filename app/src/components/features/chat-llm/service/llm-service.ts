import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import type { MarkdownSection } from "@/services/section/parsing";
import type { DocumentSource, LLMProvider } from "../types";

export class MDHDLLMService {
  private providers: Map<string, BaseLanguageModel> = new Map();
  private availableProviders: LLMProvider[] = [
    {
      id: "openai",
      name: "OpenAI",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
      description: "Powerful and versatile AI models",
    },
    {
      id: "anthropic",
      name: "Claude",
      models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
      description: "Excellent for analysis and reasoning",
    },
    {
      id: "google",
      name: "Gemini",
      models: ["gemini-1.5-pro", "gemini-1.5-flash"],
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

    const contextText = context.sections
      .map((section) => `## ${section.title}\n${section.content}`)
      .join("\n\n");

    const promptTemplate = PromptTemplate.fromTemplate(`
You are an AI assistant helping users understand a markdown document. You have access to specific sections of the document.

DOCUMENT SECTIONS:
{context}

RELEVANT EXCERPTS:
{sources}

USER QUESTION: {question}

Please provide a helpful and accurate response based on the provided document sections. If the information isn't available in the given sections, clearly state that. Always reference specific sections when possible.

Response:`);

    const sourcesText = context.sources
      .map((source) => `- ${source.sectionTitle}: ${source.excerpt}`)
      .join("\n");

    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({
      context: contextText,
      sources: sourcesText,
      question: query,
    });

    return response;
  }
}
