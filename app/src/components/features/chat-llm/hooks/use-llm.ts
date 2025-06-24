import { useMemo } from "react";
import {
  useLLMContext,
  type LLMContextState,
  type LLMContextActions,
} from "../context/llm/use-llm";

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
