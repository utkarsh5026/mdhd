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
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex w-full items-center max-w-full")}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm w-full max-w-full overflow-hidden",
                message.type === "user"
                  ? "bg-background/10 text-primary-foreground backdrop-blur-2xl border-none"
                  : message.type === "system"
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  : "bg-muted"
              )}
            >
              <div className="leading-relaxed text-sm text-muted-foreground flex items-start justify-start gap-2 max-w-full">
                <span className="flex items-center justify-center mt-1 flex-shrink-0">
                  {message.type === "user" && (
                    <IoMdPerson className="w-3 h-3" />
                  )}
                </span>
                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                  <ChatMarkdownRenderer
                    content={message.content}
                    className="text-inherit w-full max-w-full"
                  />
                </div>
              </div>

              {message.type === "user" && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex gap-1 text-muted-foreground">
                    {message.selectedSections &&
                      message.selectedSections.length > 0 &&
                      message.selectedSections.map(({ title, id }) => (
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
              {message.type === "assistant" && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex gap-1 text-muted-foreground">
                    {message.provider && message.model && (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {getProviderIcon(message.provider)}
                        <span className="ml-1">{message.model}</span>
                      </Badge>
                    )}
                    {message.selectedSections &&
                      message.selectedSections.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          {message.selectedSections.length} sections
                        </Badge>
                      )}
                  </div>
                </div>
              )}

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground">Sources:</div>
                  {message.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-background/50 rounded-lg p-2"
                    >
                      <div className="font-medium mb-1">{source.title}</div>
                      <div className="text-muted-foreground mb-2">
                        {source.excerpt}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {source.relevanceScore
                          ? Math.round(source.relevanceScore * 100)
                          : "No match"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
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
