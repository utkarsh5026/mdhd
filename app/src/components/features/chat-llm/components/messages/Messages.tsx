import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { RiLoader4Line } from "react-icons/ri";
import { UserMessage, LLmMessage } from "./";
import type {
  ChatMessage,
  LLMProviderId,
} from "@/components/features/chat-llm/types";

interface MessagesProps {
  messages: ChatMessage[];
  isQueryLoading: boolean;
  getProviderIcon: (providerId: LLMProviderId) => React.ReactNode;
  messageEndRef: React.RefObject<HTMLDivElement | null>;
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
            transition={{
              duration: message.isStreaming ? 0.1 : 0.3,
              ease: "easeOut",
            }}
            className={cn("flex w-full items-center max-w-full")}
          >
            {message.type === "user" && <UserMessage message={message} />}
            {message.type === "assistant" && (
              <LLmMessage message={message} getProviderIcon={getProviderIcon} />
            )}
            {message.type === "system" && (
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm w-full max-w-full overflow-hidden",
                  "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                )}
              >
                <div className="leading-relaxed text-sm">{message.content}</div>
              </div>
            )}
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
