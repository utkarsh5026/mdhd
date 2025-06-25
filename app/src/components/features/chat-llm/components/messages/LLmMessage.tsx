import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RiLoader4Line } from "react-icons/ri";
import ChatMarkdownRenderer from "../ChatMarkdownRenderer";
import type { ChatMessage, LLMProviderId } from "../../types";

interface LLmMessageProps {
  message: ChatMessage;
  getProviderIcon: (providerId: LLMProviderId) => React.ReactNode;
}

const LLmMessage: React.FC<LLmMessageProps> = ({
  message,
  getProviderIcon,
}) => {
  const { content, selections, provider, model, isStreaming } = message;

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm w-full max-w-full overflow-hidden",
        "bg-transparent"
      )}
    >
      <div className="leading-relaxed text-sm text-muted-foreground flex items-start justify-start gap-2 max-w-full">
        <span className="flex items-center justify-center mt-1 flex-shrink-0">
          {isStreaming && (
            <RiLoader4Line className="w-3 h-3 animate-spin text-primary" />
          )}
        </span>
        <div className="flex-1 min-w-0 max-w-full overflow-hidden">
          <ChatMarkdownRenderer
            content={content}
            className="text-inherit w-full max-w-full"
            isStreaming={isStreaming}
          />
          {isStreaming && content && (
            <span
              className="inline-block w-2 h-4 bg-primary ml-1 opacity-75"
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex gap-1 text-muted-foreground">
          {provider && model && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {getProviderIcon(provider)}
              <span className="ml-1">{model}</span>
            </Badge>
          )}
          {selections && selections.length > 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {selections.length} sections
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLmMessage;
