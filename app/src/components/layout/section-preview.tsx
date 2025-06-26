import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Hash, Layers } from "lucide-react";

import type { MarkdownSection } from "@/services/section/parsing";

interface SectionPreviewProps {
  sections: MarkdownSection[];
}

const SectionPreview: React.FC<SectionPreviewProps> = ({ sections }) => (
  <Card className="bg-card/50 backdrop-blur-xl border-border/50">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Layers className="w-5 h-5" />
        Section Preview
      </CardTitle>
    </CardHeader>
    <CardContent>
      {sections.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{section.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Level {section.level}</span>
                  <span>{section.wordCount} words</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Hash className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No sections detected</p>
          <p className="text-sm">Add # or ## headings to create sections</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default SectionPreview;
