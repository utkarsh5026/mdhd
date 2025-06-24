import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { MessageSquare } from "lucide-react";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";

interface QuestionsAvailableProps {
  currentComponent: ComponentSelection;
  suggestedQuestions: string[];
  handleQuestionClick: (question: string) => void;
}

const QuestionsAvailable: React.FC<QuestionsAvailableProps> = ({
  currentComponent,
  suggestedQuestions,
  handleQuestionClick,
}) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          What would you like to know?
        </h3>
        <p className="text-sm text-muted-foreground break-words">
          Ask me anything about this {currentComponent.type} component
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-3 overflow-hidden">
        <div className="text-sm font-medium text-muted-foreground">
          Quick questions:
        </div>
        <div className="grid gap-2 max-h-[300px] overflow-y-auto">
          {suggestedQuestions.slice(0, 6).map((question, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Button
                variant="ghost"
                onClick={() => handleQuestionClick(question)}
                className="w-full justify-start text-left h-auto p-3 text-sm hover:bg-accent/50 rounded-2xl border border-border/50 hover:border-primary/50 transition-all duration-200 break-words whitespace-normal"
              >
                <Sparkles className="h-4 w-4 mr-3 flex-shrink-0 text-primary" />
                <span className="text-left break-words">{question}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionsAvailable;
