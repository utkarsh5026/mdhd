import { createContext, useContext, useMemo } from "react";
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

export const useLLMState = (): LLMContextState => {
  const {
    llmService,
    isInitialized,
    isLoading,
    error,
    selectedProvider,
    selectedModel,
    availableProviders,
  } = useLLMContext();

  return {
    llmService,
    isInitialized,
    isLoading,
    error,
    selectedProvider,
    selectedModel,
    availableProviders,
  };
};

export const useLLMActions = (): LLMContextActions => {
  const {
    updateProvider,
    getCurrentProvider,
    isProviderModelAvailable,
    reinitialize,
    clearError,
  } = useLLMContext();

  return {
    updateProvider,
    getCurrentProvider,
    isProviderModelAvailable,
    reinitialize,
    clearError,
  };
};

export const useLLMProvider = () => {
  const {
    selectedProvider,
    selectedModel,
    availableProviders,
    updateProvider,
  } = useLLMContext();

  const currentProvider = useMemo(
    () => availableProviders.find((p) => p.id === selectedProvider) || null,
    [availableProviders, selectedProvider]
  );

  const availableModels = useMemo(
    () => currentProvider?.models || [],
    [currentProvider]
  );

  return {
    selectedProvider,
    selectedModel,
    currentProvider,
    availableProviders,
    availableModels,
    updateProvider,
  };
};
