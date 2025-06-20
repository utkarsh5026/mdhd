import { useEnhancedChatStore } from "../../../chat-llm/store/chat-store";
import { ComponentSelection } from "../../services/component-service";
import { MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getComponentIcon, getComponentColorScheme } from "./utils";
import { Trash2 } from "lucide-react";
import ChatMarkdownRenderer from "@/components/features/chat-llm/components/ChatMarkdownRenderer";

interface DropdownChatMessagesProps {
  currentComponent: ComponentSelection;
}

const DropdownChatMessages: React.FC<DropdownChatMessagesProps> = ({
  currentComponent,
}) => {
  const messages = useEnhancedChatStore(
    (state) => state.getActiveConversation()?.messages
  );
  const isQueryLoading = useEnhancedChatStore((state) => state.isQueryLoading);

  // Filter messages that are relevant to this component or general conversation
  const relevantMessages = messages
    ?.filter(
      (message) =>
        message.type === "system" ||
        message.selections?.some((sel) => sel.id === currentComponent.id) ||
        (!message.selections && message.type === "assistant")
    )
    .slice(-3); // Show last 3 relevant messages

  if (relevantMessages?.length === 0 && !isQueryLoading) {
    return (
      <div className="p-3 text-center text-muted-foreground text-sm">
        <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p>Ask a question to start the conversation</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-60 p-2">
      <div className="space-y-3">
        {relevantMessages?.map((message) => (
          <div key={message.id} className="space-y-1">
            <div
              className={cn(
                "p-2 rounded-md text-xs",
                message.type === "user"
                  ? "bg-primary text-primary-foreground ml-4"
                  : message.type === "system"
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-secondary text-secondary-foreground mr-4"
              )}
            >
              <ChatMarkdownRenderer content={message.content} />

              {/* Show what was asked about for user messages */}
              {message.type === "user" && message.selections && (
                <div className="mt-1 pt-1 border-t border-primary/20">
                  <div className="text-xs opacity-80 mb-1">Asked about:</div>
                  <div className="flex flex-wrap gap-1">
                    {message.selections.map((selection) => (
                      <ComponentBadge
                        key={selection.id}
                        component={selection}
                        showRemove={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isQueryLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
            <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
            AI is thinking...
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

/**
 * Component badge for displaying in chat
 */
const ComponentBadge: React.FC<{
  component: ComponentSelection;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}> = ({ component, onRemove, showRemove = true }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs border",
        getComponentColorScheme(component.type)
      )}
    >
      {getComponentIcon(component.type)}
      <span className="font-medium truncate max-w-32">{component.title}</span>
      {showRemove && onRemove && (
        <button
          onClick={() => onRemove(component.id)}
          className="hover:bg-black/10 rounded p-0.5 ml-1"
          title="Remove from context"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default DropdownChatMessages;
