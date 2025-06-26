import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, ChevronDown } from "lucide-react";

interface SuggestedQuestionsDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: string[];
  onQuestionSelect: (question: string) => void;
  componentType: string;
  disabled?: boolean;
}

const SuggestedQuestionsDropdown: React.FC<SuggestedQuestionsDropdownProps> = ({
  open,
  onOpenChange,
  questions,
  onQuestionSelect,
  componentType,
  disabled = false,
}) => {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8 rounded-2xl"
          disabled={disabled}
        >
          <Lightbulb className="w-4 h-4" />
          <span className="text-xs">Suggestions</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-64 overflow-y-auto font-cascadia-code rounded-2xl backdrop-blur-2xl border-1 border-border bg-card"
        align="end"
      >
        <DropdownMenuLabel className="text-xs">
          Questions about {componentType}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {questions.slice(0, 8).map((question, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onQuestionSelect(question)}
            className="text-xs leading-relaxed py-3 cursor-pointer hover:bg-primary/5"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
              <span className="break-words">{question}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SuggestedQuestionsDropdown;
