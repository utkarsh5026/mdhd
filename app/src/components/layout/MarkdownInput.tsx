import { Play, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownSection } from "@/services/section/parsing";

interface MarkdownInputProps {
  markdownInput: string;
  setMarkdownInput: (markdownInput: string) => void;
  handleStartReading: () => void;
  isTyping: boolean;
  wordCount: number;
  parsedSections: MarkdownSection[];
}

const MarkdownInput: React.FC<MarkdownInputProps> = ({
  markdownInput,
  setMarkdownInput,
  handleStartReading,
  isTyping,
  wordCount,
  parsedSections,
}) => {
  const hasContent = markdownInput.trim().length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="w-full max-w-2xl"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

        <CardContent className="relative z-10 p-6 lg:p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <motion.textarea
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
                placeholder="# Your First Section
Start typing your markdown content here...

## Subsection  
Each heading creates a new focused reading card.

```javascript
// Code blocks are preserved
console.log('Hello, World!');
```

Transform your content into digestible sections for better focus and comprehension."
                className={cn(
                  "w-full h-60 p-4 rounded-2xl border-0 resize-none",
                  "bg-background/50 backdrop-blur-sm transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background/70",
                  "text-sm leading-relaxed placeholder:text-muted-foreground/60",
                  "scrollbar-hide font-mono"
                )}
                whileFocus={{ scale: 1.01 }}
              />

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                    <span className="text-xs text-primary">Writing...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stats */}
            <AnimatePresence>
              {markdownInput.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between text-xs text-muted-foreground"
                >
                  <div className="flex items-center gap-4">
                    <span>{wordCount} words</span>
                    <span>{parsedSections.length} sections</span>
                    <span>~{Math.ceil(wordCount / 250)} min read</span>
                  </div>
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-primary">Ready to read</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleStartReading}
              disabled={!hasContent}
              size="lg"
              className={cn(
                "w-full h-16 text-lg font-bold relative overflow-hidden group",
                "bg-gradient-to-r from-primary via-primary/90 to-primary",
                "hover:from-primary/90 hover:via-primary hover:to-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300",
                "border-0 rounded-2xl cursor-pointer"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <div className="relative z-10 flex items-center justify-center gap-3">
                <motion.div
                  animate={hasContent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Play className="w-6 h-6" />
                </motion.div>
                <span>Start Focused Reading</span>
                <motion.div
                  animate={hasContent ? { x: [0, 4, 0] } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.div>
              </div>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MarkdownInput;
