import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IoMenu, IoChevronDown, IoTrashOutline } from "react-icons/io5";
import type { Conversation } from "../../types";

interface ConversationHeaderProps {
  conversation: Conversation | null;
  onOpenConversationList: () => void;
  onDeleteConversation?: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  onOpenConversationList,
  onDeleteConversation,
}) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenConversationList}
          className="h-8 px-2 flex items-center gap-2 hover:bg-primary/10"
        >
          <IoMenu className="w-4 h-4" />
          <span className="text-sm font-medium truncate max-w-32">
            {conversation?.title || "No Conversation"}
          </span>
          <IoChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {conversation && (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {conversation.messages.length} messages
          </Badge>
          {onDeleteConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteConversation}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            >
              <IoTrashOutline className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationHeader;
