import { useState } from "react";
import { ComponentSelection } from "../../services/component-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import {
  useConversation,
  useMessageActions,
} from "@/components/features/chat-llm/hooks";

interface ChatInputProps {
  currentComponent: ComponentSelection;
  onQuestionSubmit: (question: string) => void;
  variant?: "default" | "chat";
}

const ChatInput: React.FC<ChatInputProps> = ({
  currentComponent,
  onQuestionSubmit,
  variant = "default",
}) => {
  const [localQuestion, setLocalQuestion] = useState("");
  const { activeConversation } = useConversation();
  const { addMessage } = useMessageActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localQuestion.trim()) return;

    const exists = activeConversation?.selectedComponents?.some(
      (c) => c.id === currentComponent.id
    );
    if (exists || !activeConversation?.id) return;

    const activeConversationId = activeConversation.id;

    const userMessage = {
      content: localQuestion,
      selections: [currentComponent],
    };

    addMessage(userMessage, "user", activeConversationId);
    onQuestionSubmit(localQuestion);

    const currentInput = localQuestion;
    setLocalQuestion("");

    try {
      setTimeout(() => {
        const assistantMessage = {
          content: `Based on your question about this ${
            currentComponent.type
          }: "${currentInput}"

I can help explain this component. Here's what I understand:

${currentComponent.content.slice(0, 200)}...

[This response will be enhanced when you integrate with your LLM service]`,
        };
        addMessage(assistantMessage, "assistant", activeConversationId);
      }, 1500);
    } catch (error) {
      console.error("Failed to get response:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const containerClass =
    variant === "chat" ? "p-3 border-t border-border bg-muted/30" : "";

  const inputClass =
    variant === "chat"
      ? "text-sm h-8 flex-1 border-none font-cascadia-code focus-visible:border-none"
      : "text-sm h-8 flex-1 border-none font-cascadia-code focus-visible:border-none rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0";

  return (
    <form onSubmit={handleSubmit} className={containerClass}>
      <div className="flex gap-2">
        <Input
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          placeholder={
            variant === "chat"
              ? "Ask about this component..."
              : "Type your question..."
          }
          className={inputClass}
          onKeyPress={handleKeyPress}
          autoFocus
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          disabled={!localQuestion.trim()}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
