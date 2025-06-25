import { RiLoader4Line, RiRobot2Fill } from "react-icons/ri";
import { SettingsDropdown } from "../chat-input";
import { getProviderIcon } from "../utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IoClose, IoWarning } from "react-icons/io5";
import { FaHourglass } from "react-icons/fa";
import { useLLMProvider } from "../../hooks/use-llm";

interface ChatHeaderProps {
  isQueryLoading: boolean;
  onToggle: () => void;
  error: string | null;
  onOpenConversationList: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isQueryLoading,
  onToggle,
  error,
  onOpenConversationList,
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
        <div className="flex items-center">
          <ButtonTooltip tooltip="History" onClick={onOpenConversationList}>
            <FaHourglass className="w-4 h-4" />
          </ButtonTooltip>
          <ButtonTooltip tooltip="Settings" onClick={() => {}}>
            <SettingsDropdown
              providers={availableProviders}
              getProviderIcon={getProviderIcon}
            />
          </ButtonTooltip>
          <ButtonTooltip tooltip="Close" onClick={onToggle}>
            <IoClose className="w-4 h-4" />
          </ButtonTooltip>
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

interface ButtonTooltipProps {
  children: React.ReactNode;
  tooltip: string;
  onClick: () => void;
}

const ButtonTooltip: React.FC<ButtonTooltipProps> = ({
  children,
  tooltip,
  onClick,
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={onClick}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-background text-foreground rounded-2xl p-3 text-xs font-cascadia-code">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ChatHeader;
