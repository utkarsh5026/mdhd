import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";

export type LLMProviderId = "openai" | "anthropic" | "google";

export type LLMProvider = {
  id: LLMProviderId;
  name: string;
  models: string[];
  description: string;
};

export type ChatMessageType = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  selections?: ComponentSelection[]; // What was selected when asking
  model?: string;
  provider?: LLMProviderId;
  isStreaming?: boolean;
}

/**
 * Conversation represents a complete discussion thread
 * Each conversation has its own messages and component context
 */
export interface Conversation {
  id: string;
  title: string; // Auto-generated from first message or user-defined
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  selectedComponents: ComponentSelection[]; // Components in this conversation's context
  currentSectionId?: string; // Which section this conversation started from
  currentSectionTitle?: string;
  error?: Error;
  retryCount?: number;
}

/**
 * Conversation metadata for efficient listing and management
 */
export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage?: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  componentCount: number;
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

export type LLMQueryOptions = {
  components: ComponentSelection[];
  provider: LLMProviderId;
  model: string;
  temperature?: number;
  maxTokens?: number;
};
