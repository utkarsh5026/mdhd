import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useConversationLLMManager } from "../hooks";
import { IoTrashOutline, IoAddOutline } from "react-icons/io5";
import { Conversation } from "../types";

/**
 * Enhanced Conversation List Component with modern UI/UX
 */
export const ConversationListDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const {
    activeConversation,
    conversations,
    createConversation,
    deleteConversation,
    setActiveConversation,
  } = useConversationLLMManager();

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    onOpenChange(false);
  };

  const handleCreateNew = () => {
    createConversation();
    onOpenChange(false);
  };

  const conversationArray = Array.from(conversations.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl font-cascadia-code rounded-3xl">
        <DialogHeader>
          <DialogTitle>Conversations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={handleCreateNew}
            className="w-full justify-start gap-2 rounded-2xl border-none hover:bg-primary/90 hover:text-primary hover:scale-105 transition-all duration-300 cursor-pointer"
            variant="ghost"
          >
            <IoAddOutline className="w-4 h-4" />
            New Conversation
          </Button>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {conversationArray.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeConversation?.id === conv.id}
                  onSelect={() => handleSelectConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))}
            </div>
          </ScrollArea>

          {conversations.size === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a new conversation to begin</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      className={cn(
        "p-3  border cursor-pointer hover:bg-muted/50 transition-colors group rounded-2xl",
        isActive && "border-primary bg-primary/5"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className="font-medium text-sm truncate"
            title={conversation.title}
          >
            {conversation.title}
          </div>
          {conversation.messages.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {conversation.messages[conversation.messages.length - 1].content}
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <span>{conversation.messages.length} messages</span>
            <span>{formatLastActivity(new Date(conversation.updatedAt))}</span>
            {isActive && (
              <Badge
                variant="default"
                className="text-xs bg-primary/10 text-primary rounded-full"
              >
                active
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 cursor-pointer hover:bg-primary/60 hover:text-destructive rounded-full transition-all duration-300"
        >
          <IoTrashOutline className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const formatLastActivity = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return "Yesterday";
  return date.toLocaleDateString();
};
