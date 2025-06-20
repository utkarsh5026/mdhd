import { useState } from "react";
import { ComponentSelection } from "../../services/component-service";
import { useEnhancedChatStore } from "../../../chat-llm/store/chat-store";
import { ChatMessage } from "../../../chat-llm/store/chat-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

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
  const selectedComponents = useEnhancedChatStore(
    (state) => state.getActiveConversation()?.selectedComponents
  );
  const addComponentToChat = useEnhancedChatStore(
    (state) => state.addComponentToConversation
  );
  const addMessage = useEnhancedChatStore((state) => state.addMessage);
  const setIsQueryLoading = useEnhancedChatStore(
    (state) => state.setIsQueryLoading
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localQuestion.trim()) return;

    // Add component to context if not already there
    const exists = selectedComponents?.some(
      (c) => c.id === currentComponent.id
    );
    if (!exists) {
      addComponentToChat(currentComponent);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: localQuestion,
      timestamp: new Date(),
      selections: [currentComponent],
    };

    addMessage(userMessage);

    // Call the original handler
    onQuestionSubmit(localQuestion);

    const currentInput = localQuestion;
    setLocalQuestion("");
    setIsQueryLoading(true);

    try {
      // Simulate LLM response (replace with actual LLM integration)
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: "assistant",
          content: `Based on your question about this ${
            currentComponent.type
          }: "${currentInput}"

I can help explain this component. Here's what I understand:

${currentComponent.content.slice(0, 200)}...

[This response will be enhanced when you integrate with your LLM service]`,
          timestamp: new Date(),
        };

        addMessage(assistantMessage);
        setIsQueryLoading(false);
      }, 1500);
    } catch (error) {
      setIsQueryLoading(false);
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
