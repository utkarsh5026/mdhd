export type LLMProviderId = "openai" | "anthropic" | "google";

export type LLMProvider = {
  id: LLMProviderId;
  name: string;
  models: string[];
  description: string;
};

export type ChatMessageType = "user" | "assistant" | "system";

export type SeletctedSection = {
  id: string;
  title: string;
  excerpt?: string;
  relevanceScore?: number;
};

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  selectedSections?: SeletctedSection[];
  model?: string;
  provider?: LLMProviderId;
  sources?: Array<SeletctedSection>;
  isStreaming?: boolean;
}

export type DocumentSource = {
  sectionId: string;
  sectionTitle: string;
  excerpt: string;
  relevanceScore: number;
};

export type QueryContext = {
  selectedSections: string[];
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
};
