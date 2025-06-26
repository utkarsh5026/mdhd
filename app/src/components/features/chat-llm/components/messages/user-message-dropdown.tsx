import { useActiveConversation } from "../../hooks/use-conversation";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const UserMessageDropdown: React.FC = () => {
  const { activeConversation } = useActiveConversation();

  const userMessages = useMemo(() => {
    if (!activeConversation?.messages) return [];
    return activeConversation.messages.filter(
      (message) => message.type === "user"
    );
  }, [activeConversation?.messages]);

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(messageId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Add a subtle highlight effect
      element.style.transition = "background-color 0.3s ease";
      element.style.backgroundColor = "rgba(var(--primary), 0.1)";
      setTimeout(() => {
        element.style.backgroundColor = "";
      }, 1000);
    }
  };

  if (userMessages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 max-h-80 overflow-y-auto bg-background/40 backdrop-blur-2xl border border-border rounded-2xl p-2 font-type-mono text-xs"
      >
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          User Messages ({userMessages.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMessages.map((message) => (
          <DropdownMenuItem
            key={message.id}
            onClick={() => scrollToMessage(message.id)}
            className="cursor-pointer hover:bg-accent/50 focus:bg-accent/50 font-cascadia-code"
          >
            <div className="flex flex-col gap-1 w-full">
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </span>
              <span className="text-sm truncate leading-relaxed">
                {message.content.length > 50
                  ? `${message.content.substring(0, 50)}...`
                  : message.content}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMessageDropdown;
