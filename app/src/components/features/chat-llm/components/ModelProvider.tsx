import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IoChevronDown, IoCheckmark } from "react-icons/io5";
import type { LLMProviderId } from "../types";
import { useLLMState, useLLMActions } from "../hooks";

interface ModelProviderProps {
  modelPopoverOpen: boolean;
  setModelPopoverOpen: (open: boolean) => void;
  getProviderIcon: (providerId: LLMProviderId) => React.ReactNode;
}

const ModelProvider: React.FC<ModelProviderProps> = ({
  modelPopoverOpen,
  setModelPopoverOpen,
  getProviderIcon,
}) => {
  const { selectedProvider, selectedModel, availableProviders, isInitialized } =
    useLLMState();
  const { updateProvider } = useLLMActions();

  return (
    <Popover open={modelPopoverOpen} onOpenChange={setModelPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-9 text-xs rounded-2xl border-1 border-border bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30"
          disabled={!isInitialized}
        >
          <div className="flex items-center gap-2">
            {getProviderIcon(selectedProvider)}
            <span className="text-xs truncate font-medium text-muted-foreground">
              {selectedModel.length > 15
                ? selectedModel.substring(0, 15) + "..."
                : selectedModel}
            </span>
          </div>
          <IoChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-2xl border-none shadow-none font-cascadia-code"
        align="start"
      >
        <div className="p-3">
          <div className="space-y-3">
            {availableProviders.map((provider) => (
              <div key={provider.id}>
                <div className="flex items-center gap-2 mb-2">
                  {getProviderIcon(provider.id as LLMProviderId)}
                  <span className="text-xs font-medium text-muted-foreground">
                    {provider.name}
                  </span>
                </div>
                <div className="space-y-1 ml-6">
                  {provider.models.map((model) => (
                    <button
                      key={model}
                      onClick={() => updateProvider(provider.id, model)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-2xl text-xs transition-colors",
                        selectedProvider === provider.id &&
                          selectedModel === model
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{model}</span>
                        {selectedProvider === provider.id &&
                          selectedModel === model && (
                            <IoCheckmark className="w-3 h-3 text-primary" />
                          )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ModelProvider;
