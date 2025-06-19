import { useState } from "react";
import { ComponentSelection } from "../../services/component-service";
import { useSimpleChatStore } from "../../../chat-llm/store/chat-store";
import { ChatMessage } from "../../../chat-llm/store/chat-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const ChatInput: React.FC<{
  currentComponent: ComponentSelection;
  onQuestionSubmit: (question: string) => void;
}> = ({ currentComponent, onQuestionSubmit }) => {
  const [localQuestion, setLocalQuestion] = useState("");
  const selectedComponents = useSimpleChatStore(
    (state) => state.selectedComponents
  );
  const addComponentToChat = useSimpleChatStore(
    (state) => state.addComponentToChat
  );
  const addMessage = useSimpleChatStore((state) => state.addMessage);
  const setIsQueryLoading = useSimpleChatStore(
    (state) => state.setIsQueryLoading
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localQuestion.trim()) return;

    // Add component to context if not already there
    const exists = selectedComponents.some((c) => c.id === currentComponent.id);
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

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border-t border-border bg-muted/30"
    >
      <div className="flex gap-2">
        <Input
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          placeholder="Ask about this component..."
          className="text-sm h-8 flex-1"
          onKeyPress={handleKeyPress}
          autoFocus
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={!localQuestion.trim()}
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
