import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  handleSendMessage: (message: string) => void;
  hasStartedChat: boolean;
  suggestedQuestions: string[];
  handleQuestionClick: (question: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputRef,
  inputValue,
  setInputValue,
  handleKeyDown,
  isLoading,
  handleSendMessage,
  hasStartedChat,
  suggestedQuestions,
  handleQuestionClick,
}) => {
  return (
    <div className="flex-shrink-0 p-6 border-t border-border bg-gradient-to-t from-muted/30 to-transparent overflow-hidden">
      <div className="flex gap-3 w-full">
        <Textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here..."
          disabled={isLoading}
          className="flex-1 text-sm border-border focus-visible:ring-none focus-visible:ring-offset-0 rounded-2xl h-12 px-4 min-w-0 resize-none focus-visible:border-primary/50 focus-visible:border-2"
        />

        <Button
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          size="icon"
          className="h-12 w-12 rounded-2xl hover:scale-105 transition-transform cursor-pointer"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Bot className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: 1.1, rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Send className="h-5 w-5" />
            </motion.div>
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      {!hasStartedChat && (
        <div className="mt-3 flex flex-wrap gap-2 overflow-hidden">
          {suggestedQuestions.slice(0, 3).map((question, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-accent text-xs px-3 py-1 rounded-full transition-colors break-words max-w-full"
              onClick={() => handleQuestionClick(question)}
            >
              <span className="truncate">{question}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatInput;
