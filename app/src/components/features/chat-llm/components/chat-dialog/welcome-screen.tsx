import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Welcome Screen
 */
interface WelcomeScreenProps {
  componentType: string;
  componentTitle: string;
  onQuestionClick: (question: string) => void;
  suggestedQuestions: string[];
  isInitialized: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  componentType,
  componentTitle,
  onQuestionClick,
  suggestedQuestions,
  isInitialized,
}) => {
  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-4"
          >
            <Sparkles className="w-12 h-12 text-primary" />
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">
            Initializing AI Assistant
          </h3>
          <p className="text-sm text-muted-foreground">
            Setting up the conversation system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          What would you like to know?
        </h3>
        <p className="text-sm text-muted-foreground break-words max-w-md mx-auto">
          Ask me anything about this {componentType}: "{componentTitle}"
        </p>
      </div>

      {/* Quick starter questions */}
      {suggestedQuestions.length > 0 && (
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="text-sm font-medium text-muted-foreground mb-3 text-center">
            Try asking:
          </div>
          {suggestedQuestions.map((question, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Button
                variant="ghost"
                onClick={() => onQuestionClick(question)}
                className="w-full justify-start text-left h-auto p-4 text-sm hover:bg-accent/50 rounded-2xl border border-border/50 hover:border-primary/50 transition-all duration-200"
              >
                <Sparkles className="h-4 w-4 mr-3 flex-shrink-0 text-primary" />
                <span className="text-left break-words">{question}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
