import { BookOpen, Code2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { motion } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";

interface ExampleContentProps {
  onLoadSample: (key: string) => void;
}

const ExampleContent: React.FC<ExampleContentProps> = ({ onLoadSample }) => (
  <Card className="bg-card/50 backdrop-blur-xl border-border/50">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Example Content
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {[
        {
          key: "tutorial",
          title: "Tutorial Guide",
          desc: "Learn MDHD features",
          icon: Target,
        },
        {
          key: "documentation",
          title: "API Docs",
          desc: "Technical documentation",
          icon: Code2,
        },
        {
          key: "guide",
          title: "ML Guide",
          desc: "Educational content",
          icon: Brain,
        },
      ].map((example) => (
        <motion.button
          key={example.key}
          onClick={() => onLoadSample(example.key)}
          className="w-full p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/50 hover:bg-background/70 transition-all text-left group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <example.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{example.title}</p>
              <p className="text-sm text-muted-foreground">{example.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </motion.button>
      ))}
    </CardContent>
  </Card>
);

export default ExampleContent;
