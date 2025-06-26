import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Clock, FileText, Hash, Play, Edit3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateThemeColors } from "@/utils/colors";
import { useTheme } from "@/components/shared/theme/hooks/use-theme";
import type { MarkdownSection } from "@/services/section/parsing";

interface MarkdownEditorProps {
  markdownInput: string;
  setMarkdownInput: (value: string) => void;
  wordCount: number;
  parsedSections: MarkdownSection[];
  handleStartReading: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdownInput,
  setMarkdownInput,
  wordCount,
  parsedSections,
  handleStartReading,
}) => {
  const { currentTheme } = useTheme();
  const hasContent = markdownInput.trim().length > 0;
  const themeColors = generateThemeColors(currentTheme.primary, 3);
  const readingLevel = getReadingLevel(wordCount, themeColors);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card/60 via-card/40 to-background/20 backdrop-blur-2xl border-border/30 rounded-3xl shadow-2xl shadow-primary/5">
      <CardHeader className="relative pb-4 z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Edit3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Markdown Editor
            </span>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        <MarkdownTextArea
          markdownInput={markdownInput}
          setMarkdownInput={setMarkdownInput}
          hasContent={hasContent}
        />

        {hasContent && (
          <Stats
            wordCount={wordCount}
            parsedSections={parsedSections}
            readingLevel={readingLevel}
            handleStartReading={handleStartReading}
          />
        )}

        {!hasContent && <EmptyState />}
      </CardContent>
    </Card>
  );
};

const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-8"
    >
      <motion.div
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
      >
        <Edit3 className="w-8 h-8 text-primary/60" />
      </motion.div>
      <p className="text-muted-foreground text-sm">
        Ready to create something amazing? Start typing above! ✨
      </p>
    </motion.div>
  );
};

interface StatsProps {
  wordCount: number;
  parsedSections: MarkdownSection[];
  readingLevel: { text: string; color: string; icon: React.ElementType };
  handleStartReading: () => void;
}

const Stats: React.FC<StatsProps> = ({
  wordCount,
  parsedSections,
  readingLevel,
  handleStartReading,
}) => {
  const stats = [
    {
      label: "Words",
      value: wordCount,
      icon: FileText,
      color: "from-primary/10 to-primary/5 border border-primary/20",
    },
    {
      label: "Sections",
      value: parsedSections.length,
      icon: Hash,
      color: "from-accent/10 to-accent/5 border border-accent/20",
    },
    {
      label: "Min read",
      value: Math.ceil(wordCount / 250),
      icon: Clock,
      color: "from-secondary/10 to-secondary/5 border border-secondary/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${stat.color} border border-border/20`}
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}
            >
              <stat.icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-background/60 to-background/40 border border-border/30">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${readingLevel.color}, ${readingLevel.color}dd)`,
            }}
          >
            <readingLevel.icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Reading Level: {readingLevel.text}
            </p>
            <p className="text-xs text-muted-foreground">
              Perfect for focused reading
            </p>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleStartReading}
            className="gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          >
            <Play className="w-4 h-4" />
            Start Reading
            <motion.div
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

interface MarkdownTextAreaProps {
  markdownInput: string;
  setMarkdownInput: (value: string) => void;
  hasContent: boolean;
}

const MarkdownTextArea: React.FC<MarkdownTextAreaProps> = ({
  markdownInput,
  setMarkdownInput,
  hasContent,
}) => {
  return (
    <div className="relative group">
      <motion.textarea
        value={markdownInput}
        onChange={(e) => setMarkdownInput(e.target.value)}
        placeholder="# Welcome to MDHD ✨

Start typing your markdown content here. Use headings to create sections:

## 🚀 Features
- Smart section parsing with AI
- Interactive chat assistant
- Real-time content analysis
- Beautiful UI components

```javascript
// Code blocks become interactive
const magic = () => {
  console.log('Transform your docs! 🎯');
};
```

> 💡 **Pro tip**: Use quotes, lists, and code blocks to create engaging content

### 📝 Ready to Begin?
Type away and watch your content come to life with intelligent parsing and beautiful formatting!"
        className={cn(
          "w-full h-96 p-6 rounded-3xl border border-border/30 resize-none relative",
          "bg-gradient-to-br from-background/60 to-background/40 backdrop-blur-xl",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
          "text-sm leading-relaxed placeholder:text-muted-foreground/50",
          "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent font-mono",
          "transition-all duration-500 hover:shadow-lg hover:shadow-primary/5",
          hasContent ? "text-foreground" : "text-muted-foreground/60"
        )}
        whileFocus={{
          scale: 1.002,
          boxShadow: "0 20px 40px -10px rgba(var(--primary), 0.1)",
        }}
      />

      {/* Character count indicator */}
      {hasContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs text-muted-foreground border border-border/30"
        >
          {markdownInput.length} chars
        </motion.div>
      )}
    </div>
  );
};

const getReadingLevel = (wordCount: number, themeColors: string[]) => {
  if (wordCount < 100)
    return { text: "Quick", color: themeColors[0], icon: Zap };
  if (wordCount < 500)
    return { text: "Standard", color: themeColors[1], icon: FileText };
  return { text: "Deep", color: themeColors[2], icon: Hash };
};

export default MarkdownEditor;
