import { createContext, useContext } from "react";
import { MDHDLLMService } from "../../service/llm-service";
import { LLMProvider, LLMProviderId } from "../../types";

export interface LLMContextConfig {
  openAIApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}

export interface LLMContextState {
  llmService: MDHDLLMService | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Provider selection
  selectedProvider: LLMProviderId;
  selectedModel: string;

  // Available providers
  availableProviders: LLMProvider[];
}

export interface LLMContextActions {
  updateProvider: (providerId: LLMProviderId, model?: string) => void;
  getCurrentProvider: () => LLMProvider | null;
  isProviderModelAvailable: (
    providerId: LLMProviderId,
    model: string
  ) => boolean;

  reinitialize: (config: LLMContextConfig) => Promise<void>;
  clearError: () => void;
}

export type LLMContextValue = LLMContextState & LLMContextActions;

export const LLMContext = createContext<LLMContextValue | null>(null);

export const useLLMContext = (): LLMContextValue => {
  const context = useContext(LLMContext);

  if (!context) {
    throw new Error("useLLMContext must be used within an LLMProvider");
  }

  return context;
};
