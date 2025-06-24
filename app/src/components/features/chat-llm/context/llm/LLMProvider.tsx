import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { MDHDLLMService } from "../../service/llm-service";
import type {
  LLMProvider as LLMProviderType,
  LLMProviderId,
} from "../../types";
import { LLMContextConfig, LLMContextValue, LLMContext } from "./use-llm";

export interface LLMProviderProps {
  children: ReactNode;
  config?: LLMContextConfig;
  defaultProvider?: LLMProviderId;
  defaultModel?: string;
}

const LLMProvider: React.FC<LLMProviderProps> = ({
  children,
  config = {},
  defaultProvider = "openai",
  defaultModel = "gpt-4o",
}) => {
  const [llmService, setLLMService] = useState<MDHDLLMService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProvider, setSelectedProvider] =
    useState<LLMProviderId>(defaultProvider);
  const [selectedModel, setSelectedModel] = useState(defaultModel);

  const initRef = useRef(false);
  const configRef = useRef(config);

  const availableProviders = useMemo(
    () => llmService?.getAvailableProviders() || [],
    [llmService]
  );

  const initializeService = useCallback(
    async (serviceConfig: LLMContextConfig) => {
      const hasAnyKey = Object.values(serviceConfig).some((key) => key);

      if (!hasAnyKey) {
        setError("No API keys provided");
        setIsInitialized(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const service = new MDHDLLMService({
          openai: serviceConfig.openAIApiKey,
          anthropic: serviceConfig.anthropicApiKey,
          google: serviceConfig.googleApiKey,
        });

        setLLMService(service);
        setIsInitialized(true);

        const providers = service.getAvailableProviders();
        if (providers.length > 0) {
          const currentProviderAvailable = providers.some(
            (p) => p.id === selectedProvider
          );

          if (currentProviderAvailable) return;

          const firstProvider = providers[0];
          setSelectedProvider(firstProvider.id);
          if (firstProvider.models.length > 0) {
            setSelectedModel(firstProvider.models[0]);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to initialize LLM service";
        setError(errorMessage);
        setIsInitialized(false);
        setLLMService(null);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedProvider]
  );

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize service when config changes
  useEffect(() => {
    const currentConfig = {
      openAIApiKey: config.openAIApiKey,
      anthropicApiKey: config.anthropicApiKey,
      googleApiKey: config.googleApiKey,
    };

    // Compare with previous config
    const prevConfig = configRef.current;
    const configChanged =
      JSON.stringify(currentConfig) !== JSON.stringify(prevConfig);

    if (!initRef.current || configChanged) {
      initRef.current = true;
      configRef.current = currentConfig;
      initializeService(currentConfig);
    }
  }, [config, initializeService]);

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  const updateProvider = useCallback(
    (providerId: LLMProviderId, model?: string) => {
      setSelectedProvider(providerId);

      if (model) {
        setSelectedModel(model);
      } else {
        // Auto-select first available model for the provider
        const provider = availableProviders.find((p) => p.id === providerId);
        if (provider && provider.models.length > 0) {
          setSelectedModel(provider.models[0]);
        }
      }
    },
    [availableProviders]
  );

  const getCurrentProvider = useCallback((): LLMProviderType | null => {
    return availableProviders.find((p) => p.id === selectedProvider) || null;
  }, [availableProviders, selectedProvider]);

  const isProviderModelAvailable = useCallback(
    (providerId: LLMProviderId, model: string): boolean => {
      const provider = availableProviders.find((p) => p.id === providerId);
      return provider ? provider.models.includes(model) : false;
    },
    [availableProviders]
  );

  const reinitialize = useCallback(
    async (newConfig: LLMContextConfig) => {
      configRef.current = newConfig;
      await initializeService(newConfig);
    },
    [initializeService]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: LLMContextValue = useMemo(
    () => ({
      // State
      llmService,
      isInitialized,
      isLoading,
      error,
      selectedProvider,
      selectedModel,
      availableProviders,

      // Actions
      updateProvider,
      getCurrentProvider,
      isProviderModelAvailable,
      reinitialize,
      clearError,
    }),
    [
      llmService,
      isInitialized,
      isLoading,
      error,
      selectedProvider,
      selectedModel,
      availableProviders,
      updateProvider,
      getCurrentProvider,
      isProviderModelAvailable,
      reinitialize,
      clearError,
    ]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <LLMContext.Provider value={contextValue}>{children}</LLMContext.Provider>
  );
};

export default LLMProvider;
