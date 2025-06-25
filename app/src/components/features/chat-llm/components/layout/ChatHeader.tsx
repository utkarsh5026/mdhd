import { RiLoader4Line, RiRobot2Fill } from "react-icons/ri";
import { SettingsDropdown } from "../chat-input";
import { getProviderIcon } from "../utils";
import { Button } from "@/components/ui/button";
import { IoClose, IoWarning } from "react-icons/io5";
import { useLLMProvider } from "../../hooks/use-llm";

interface ChatHeaderProps {
  isQueryLoading: boolean;
  onToggle: () => void;
  error: string | null;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isQueryLoading,
  onToggle,
  error,
}) => {
  const { availableProviders } = useLLMProvider();

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RiRobot2Fill className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
          {isQueryLoading && (
            <RiLoader4Line className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <SettingsDropdown
            providers={availableProviders}
            getProviderIcon={getProviderIcon}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <IoClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <IoWarning className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
