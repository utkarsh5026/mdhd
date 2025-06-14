import { Play, ChevronRight, Hash, List } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MarkdownInputProps {
  markdownInput: string;
  setMarkdownInput: (markdownInput: string) => void;
  hasContent: boolean;
  handleStartReading: () => void;
}

const MarkdownInput: React.FC<MarkdownInputProps> = ({
  markdownInput,
  setMarkdownInput,
  hasContent,
  handleStartReading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl mx-auto space-y-8"
    >
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-4 rounded-2xl bg-transparent p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              MDHD
            </span>
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Transform your markdown into focused reading sessions
          </p>
        </motion.div>
      </div>

      {/* Input Card */}
      <Card className="p-6 space-y-6 border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-0 overflow-y-auto flex flex-col gap-4">
          <div className="space-y-4">
            <textarea
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

Transform your content into digestible sections for better focus."
              className={cn(
                "w-full h-80 p-4 rounded-2xl border resize-none",
                "bg-card/50 backdrop-blur-sm transition-all duration-200 text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                "text-sm leading-relaxed placeholder:text-muted-foreground/60",
                "scrollbar-hide"
              )}
            />

            {/* Character count */}
          </div>

          {/* Action Button */}
          <Button
            onClick={handleStartReading}
            disabled={!hasContent}
            size="lg"
            className={cn(
              "w-full h-14 text-base font-semibold relative cursor-pointer overflow-hidden group rounded-2xl",
              "bg-primary/60 hover:bg-primary/80 hover:scale-105 transition-all duration-300",
              "disabled:bg-muted disabled:text-muted-foreground",
              "shadow-lg hover:shadow-xl hover:shadow-primary/25"
            )}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <Play className="w-5 h-5" />
              <span>Start Focused Reading</span>
              <motion.div
                animate={hasContent ? { x: [0, 4, 0] } : {}}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center space-y-3"
      >
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span>Sections</span>
          </div>
          <div className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span>Focus Mode</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80">
          Break down complex content into digestible parts
        </p>
      </motion.div>
    </motion.div>
  );
};

export default MarkdownInput;
