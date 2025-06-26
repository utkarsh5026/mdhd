import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/components/features/chat-llm/types";
import { Messages } from "@/components/features/chat-llm/components/messages";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="p-6 space-y-4 w-full overflow-hidden">
          <AnimatePresence>
            <Messages
              messages={messages}
              isQueryLoading={isLoading}
              getProviderIcon={() => <></>}
              messageEndRef={messagesEndRef}
            />
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatMessages;
