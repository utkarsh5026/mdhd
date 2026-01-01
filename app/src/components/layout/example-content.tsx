import { BookOpen, Code2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface ExampleContentProps {
  onLoadSample: (key: string) => void;
}

const EXAMPLE_CONTENTS = [
  {
    key: 'tutorial',
    title: 'Tutorial Guide',
    desc: 'Interactive learning experience',
    icon: Target,
    iconBg: 'bg-blue-500',
  },
  {
    key: 'documentation',
    title: 'API Documentation',
    desc: 'Complete technical reference',
    icon: Code2,
    iconBg: 'bg-purple-500',
  },
  {
    key: 'guide',
    title: 'ML Learning Path',
    desc: 'Structured educational content',
    icon: Brain,
    iconBg: 'bg-emerald-500',
  },
];

const ExampleContent: React.FC<ExampleContentProps> = ({ onLoadSample }) => (
  <Card className="bg-card/60 backdrop-blur-2xl border-border/30 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden">
    <CardHeader className="relative pb-4">
      <div className="absolute inset-0 " />
      <CardTitle className="text-xl font-semibold flex items-center gap-3 relative z-10">
        <div className="w-8 h-8 bg-primary flex items-center justify-center shadow-lg rounded-2xl">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-foreground">Example Content</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 pt-2">
      {EXAMPLE_CONTENTS.map((example, index) => (
        <motion.div
          key={example.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group"
        >
          <motion.button
            onClick={() => onLoadSample(example.key)}
            className={`w-full p-5 border border-border/20 hover:border-primary/30 transition-all duration-300 text-left cursor-pointer rounded-2xl relative overflow-hidden backdrop-blur-sm`}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 10px 30px -5px rgba(var(--primary), 0.2)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div
                className={`w-12 h-12 rounded-2xl ${example.iconBg} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
              >
                <example.icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {example.title}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                  {example.desc}
                </p>
              </div>
            </div>
          </motion.button>
        </motion.div>
      ))}

      <div className="pt-4 border-t border-border/20">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <span>Click any example to get started</span>
          <div className="w-1 h-1 rounded-full bg-primary/40" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ExampleContent;
