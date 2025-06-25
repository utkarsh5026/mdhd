import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { IoMdPerson } from "react-icons/io";
import ChatMarkdownRenderer from "../ChatMarkdownRenderer";
import type { ChatMessage } from "../../types";

interface UserMessageProps {
  message: ChatMessage;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const { content, selections } = message;

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm w-full max-w-full overflow-hidden",
        "bg-background text-primary-foreground backdrop-blur-2xl border-none"
      )}
    >
      <div className="leading-relaxed text-sm text-muted-foreground flex items-start justify-start gap-2 max-w-full">
        <span className="flex items-center justify-center mt-1 flex-shrink-0">
          <IoMdPerson className="w-3 h-3" />
        </span>
        <div className="flex-1 min-w-0 max-w-full overflow-hidden">
          <ChatMarkdownRenderer
            content={content}
            className="text-inherit w-full max-w-full"
            isStreaming={false}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex gap-1 text-muted-foreground">
          {selections &&
            selections.length > 0 &&
            selections.map(({ title, id }) => (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs text-muted-foreground rounded-2xl"
              >
                {title}
              </Badge>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UserMessage;
