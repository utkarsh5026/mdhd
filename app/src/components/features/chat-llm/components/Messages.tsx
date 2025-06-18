import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { RiLoader4Line } from "react-icons/ri";

interface MessagesProps {
  messages: any[];
  isQueryLoading: boolean;
  getProviderIcon: (providerId: string) => React.ReactNode;
  messageEndRef: React.RefObject<HTMLDivElement>;
}
const Messages: React.FC<MessagesProps> = ({
  messages,
  isQueryLoading,
  getProviderIcon,
  messageEndRef,
}) => {
  return (
    <div className="space-y-4 py-4">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex",
              message.type === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                message.type === "user"
                  ? "bg-primary/10 text-primary-foreground backdrop-blur-2xl border-none"
                  : message.type === "system"
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  : "bg-muted"
              )}
            >
              <p className="leading-relaxed whitespace-pre-wrap text-sm text-muted-foreground">
                {message.content}
              </p>

              {/* Message metadata */}
              {(message.type === "user" || message.type === "assistant") && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-start flex-col gap-1 text-muted-foreground">
                    {message.provider && message.model && (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {getProviderIcon(message.provider)}
                        <span className="ml-1">{message.model}</span>
                      </Badge>
                    )}
                    {message.selectedSections &&
                      message.selectedSections.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          {message.selectedSections.length} sections
                        </Badge>
                      )}
                  </div>
                </div>
              )}

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground">Sources:</div>
                  {message.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-background/50 rounded-lg p-2"
                    >
                      <div className="font-medium mb-1">
                        {source.sectionTitle}
                      </div>
                      <div className="text-muted-foreground mb-2">
                        {source.excerpt}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(source.relevanceScore * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isQueryLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
            <RiLoader4Line className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Analyzing content...
            </span>
          </div>
        </motion.div>
      )}

      <div ref={messageEndRef} />
    </div>
  );
};

export default Messages;
