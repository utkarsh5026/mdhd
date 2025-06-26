import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Hash, Layers, BookmarkCheck, Clock } from "lucide-react";

import type { MarkdownSection } from "@/services/section/parsing";

interface SectionPreviewProps {
  sections: MarkdownSection[];
}

const SectionPreview: React.FC<SectionPreviewProps> = ({ sections }) => {
  return (
    <Card className="bg-gradient-to-br from-card/60 via-card/40 to-background/20 backdrop-blur-2xl border-border/30 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden">
      <CardHeader className="relative pb-4">
        <div className="absolute inset-0l" />
        <CardTitle className="text-xl font-semibold flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Section Preview
          </span>
          {sections.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="gap-2 rounded-full">
                {sections.length} sections
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {sections.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {sections.map((section, index) => (
              <Section key={section.id} section={section} index={index} />
            ))}

            <div className="pt-4 mt-6 border-t border-border/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  <span>
                    Total:{" "}
                    {sections.reduce(
                      (acc, section) => acc + section.wordCount,
                      0
                    )}{" "}
                    words
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    Est. reading time: ~
                    {Math.ceil(
                      sections.reduce(
                        (acc, section) => acc + section.wordCount,
                        0
                      ) / 200
                    )}{" "}
                    min
                  </span>
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <NoSectionsAvailable />
        )}
      </CardContent>
    </Card>
  );
};

interface SectionProps {
  section: MarkdownSection;
  index: number;
}

const Section: React.FC<SectionProps> = ({ section, index }) => {
  return (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className="group"
    >
      <motion.div
        className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r border border-border/20 hover:border-primary/30 transition-all duration-300 cursor-pointer relative overflow-hidden backdrop-blur-sm`}
        whileHover={{
          boxShadow: "0 8px 25px -5px rgba(var(--primary), 0.15)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className={`w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 relative z-10`}
        >
          <span className="text-sm font-bold text-white">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
              {section.title}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
              <Hash className="w-3 h-3" />
              <span>Level {section.level}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
              <Clock className="w-3 h-3" />
              <span>{section.wordCount} words</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
              <BookmarkCheck className="w-3 h-3" />
              <span>~{Math.ceil(section.wordCount / 200)} min read</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const NoSectionsAvailable = () => {
  return (
    <motion.div
      className="text-center py-16 text-muted-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center"
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <Hash className="w-8 h-8 text-primary/60" />
      </motion.div>
      <h3 className="font-semibold text-foreground mb-2">
        No sections detected
      </h3>
      <p className="text-sm mb-4">Add headings to create structured sections</p>
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {["# Heading 1", "## Heading 2", "### Heading 3"].map(
          (example, index) => (
            <motion.span
              key={example}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              {example}
            </motion.span>
          )
        )}
      </div>
    </motion.div>
  );
};
export default SectionPreview;
