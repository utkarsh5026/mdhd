import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import {
  IoTrashOutline,
  IoChatbubbleOutline,
  IoArrowUp,
} from "react-icons/io5";

import { useEnhancedChatStore } from "../store/chat-store";

/**
 * Conversation List Component for managing multiple conversations
 */
export const ConversationListDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const {
    getConversationSummaries,
    setActiveConversation,
    deleteConversation,
    createConversation,
    activeConversationId,
  } = useEnhancedChatStore();

  const conversations = getConversationSummaries();

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    onOpenChange(false);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation(conversationId);
    }
  };

  const handleCreateNew = () => {
    createConversation();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-cascadia-code rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IoChatbubbleOutline className="w-5 h-5" />
            Conversations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* New conversation button */}
          <Button
            onClick={handleCreateNew}
            className="w-full justify-start gap-2 h-auto p-3 rounded-xl"
            variant="outline"
          >
            <IoArrowUp className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Start New Conversation</div>
              <div className="text-xs text-muted-foreground">
                Begin a fresh discussion
              </div>
            </div>
          </Button>

          {/* Conversations list */}
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all group",
                    activeConversationId === conv.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {conv.title}
                      </div>
                      {conv.lastMessage && (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {conv.lastMessage}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{conv.messageCount} messages</span>
                        <span>{conv.componentCount} components</span>
                        <span>
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <IoChatbubbleOutline className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <div className="text-sm">No conversations yet</div>
              <div className="text-xs">Start by asking a question!</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
