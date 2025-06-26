import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Clock, FileText, Hash, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarkdownSection } from "@/services/section/parsing";

interface MarkdownEditorProps {
  markdownInput: string;
  setMarkdownInput: (value: string) => void;
  isTyping: boolean;
  wordCount: number;
  parsedSections: MarkdownSection[];
  handleStartReading: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdownInput,
  setMarkdownInput,
  isTyping,
  wordCount,
  parsedSections,
  handleStartReading,
}) => {
  const hasContent = markdownInput.trim().length > 0;

  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Markdown Editor</CardTitle>
          <div className="flex items-center gap-2">
            {isTyping && (
              <Badge variant="secondary" className="gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-primary rounded-full"
                />
                Processing...
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <motion.textarea
            value={markdownInput}
            onChange={(e) => setMarkdownInput(e.target.value)}
            placeholder="# Welcome to MDHD

Start typing your markdown content here. Use headings to create sections:

## Features
- Smart section parsing
- AI-powered chat
- Interactive components

```javascript
// Code blocks become interactive
console.log('Hello, MDHD!');
```

> Quotes and all markdown syntax supported

Transform your documentation into an engaging reading experience."
            className={cn(
              "w-full h-80 p-4 rounded-2xl border border-border/50 resize-none",
              "bg-background/50 backdrop-blur-sm transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "text-sm leading-relaxed placeholder:text-muted-foreground/60",
              "scrollbar-hide font-mono"
            )}
            whileFocus={{ scale: 1.005 }}
          />
        </div>

        {hasContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {wordCount} words
              </span>
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {parsedSections.length} sections
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />~{Math.ceil(wordCount / 250)} min
                read
              </span>
            </div>
            <Button
              onClick={handleStartReading}
              className="gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer hover:shadow-lg hover:shadow-primary/50"
            >
              <Play className="w-4 h-4" />
              Start Reading
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarkdownEditor;
