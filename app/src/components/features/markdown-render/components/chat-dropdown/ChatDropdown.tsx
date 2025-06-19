import type { ComponentSelection } from "../../services/component-service";
import { useState, useCallback, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  ChevronDown,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  getComponentIcon,
  getComponentColorScheme,
  getQuestionsForComponentType,
} from "./utils";
import DropdownChatMessages from "./DropdownMessages";
import ChatInput from "./ChatInput";
import { useSimpleChatStore } from "../../../chat-llm/store/chat-store";

interface ChatDropdownProps {
  currentComponent: ComponentSelection;
  onAskWithQuestion: (question: string) => void;
}

const ChatDropdown: React.FC<ChatDropdownProps> = ({
  currentComponent,
  onAskWithQuestion,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Chat store hooks
  const selectedComponents = useSimpleChatStore(
    (state) => state.selectedComponents
  );

  // Focus input when dropdown opens
  const handleDropdownOpenChange = useCallback((open: boolean) => {
    setDropdownOpen(open);
    if (!open) {
      setShowChat(false);
      setCustomQuestion("");
    }
  }, []);

  const questions = getQuestionsForComponentType(currentComponent.type);

  // Check if this component is already in context
  const isInContext = selectedComponents.some(
    (c) =>
      c.content === currentComponent.content && c.type === currentComponent.type
  );

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-2 py-0 shadow-md bg-background border border-border hover:bg-primary hover:text-primary-foreground rounded-full cursor-pointer"
        >
          <MessageSquare className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[500px] overflow-hidden p-0 rounded-2xl shadow-lg border-none bg-card font-cascadia-code backdrop-blur-2xl"
        side="bottom"
        sideOffset={5}
      >
        {/* Header */}
        <div className="p-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={cn(
                "p-1.5 rounded-md",
                getComponentColorScheme(currentComponent.type)
              )}
            >
              {getComponentIcon(currentComponent.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {currentComponent.type.charAt(0).toUpperCase() +
                  currentComponent.type.slice(1)}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {currentComponent.title}
              </div>
            </div>
            {isInContext && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Sparkles className="w-3 h-3" />
                In Context
              </div>
            )}
          </div>
        </div>

        {showChat ? (
          /* Chat Mode */
          <div className="flex flex-col">
            <div className="p-2 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  AI Assistant
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <DropdownChatMessages currentComponent={currentComponent} />

            <ChatInput
              currentComponent={currentComponent}
              onQuestionSubmit={onAskWithQuestion}
            />
          </div>
        ) : (
          /* Question Selection Mode */
          <>
            {/* Custom Question Input */}
            <div className="p-3 border-b border-border">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground mb-2 px-0">
                Ask about this {currentComponent.type}
              </DropdownMenuLabel>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customQuestion.trim()) {
                    onAskWithQuestion(customQuestion);
                    setShowChat(true);
                    setCustomQuestion("");
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Type your question..."
                  className="text-sm h-8 flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (customQuestion.trim()) {
                        onAskWithQuestion(customQuestion);
                        setShowChat(true);
                        setCustomQuestion("");
                      }
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={!customQuestion.trim()}
                >
                  <MessageCircle className="h-3 w-3" />
                </Button>
              </form>
            </div>

            {/* Predefined Questions */}
            <div className="max-h-60 overflow-y-auto">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
                Quick questions
              </DropdownMenuLabel>
              {questions.map((question, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => {
                    onAskWithQuestion(question);
                    setShowChat(true);
                  }}
                  className="text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground px-3 py-2 mx-1 my-0.5 rounded-md"
                >
                  {question}
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatDropdown;
