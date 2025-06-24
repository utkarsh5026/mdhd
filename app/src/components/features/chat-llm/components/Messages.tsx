import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { RiLoader4Line } from "react-icons/ri";
import { IoMdPerson } from "react-icons/io";
import ChatMarkdownRenderer from "./ChatMarkdownRenderer";
import type { ChatMessage, LLMProviderId } from "../types";

interface MessagesProps {
  messages: ChatMessage[];
  isQueryLoading: boolean;
  getProviderIcon: (providerId: LLMProviderId) => React.ReactNode;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

const Messages: React.FC<MessagesProps> = ({
  messages,
  isQueryLoading,
  getProviderIcon,
  messageEndRef,
}) => {
  return (
    <div className="space-y-4 py-4">
      <AnimatePresence>
        {messages.map(
          ({ id, isStreaming, type, content, selections, provider, model }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: isStreaming ? 0.1 : 0.3,
                ease: "easeOut",
              }}
              className={cn("flex w-full items-center max-w-full")}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm w-full max-w-full overflow-hidden",
                  type === "user"
                    ? "bg-background text-primary-foreground backdrop-blur-2xl border-none"
                    : type === "assistant"
                    ? "bg-transparent"
                    : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                )}
              >
                <div className="leading-relaxed text-sm text-muted-foreground flex items-start justify-start gap-2 max-w-full">
                  <span className="flex items-center justify-center mt-1 flex-shrink-0">
                    {type === "user" && <IoMdPerson className="w-3 h-3" />}
                    {type === "assistant" && isStreaming && (
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

                {type === "user" && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex gap-1 text-muted-foreground">
                      {selections &&
                        selections.length > 0 &&
                        selections.map(({ title, id }) => (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="text-xs text-muted-foreground rounded-2xl"
                          >
                            {title}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
                {type === "assistant" && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex gap-1 text-muted-foreground">
                      {provider && model && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          {getProviderIcon(provider)}
                          <span className="ml-1">{model}</span>
                        </Badge>
                      )}
                      {selections && selections.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          {selections.length} sections
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {isQueryLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
            <RiLoader4Line className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Analyzing content...
            </span>
          </div>
        </motion.div>
      )}

      <div ref={messageEndRef} />
    </div>
  );
};

export default Messages;
