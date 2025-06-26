import { motion } from "framer-motion";
import { Hash, Sparkles, Target, Zap } from "lucide-react";

const HeroMain = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center space-y-8 mb-16"
    >
      <div className="relative">
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent relative">
            Transform Markdown
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 blur-2xl"
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </span>
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Into intelligent, interactive reading experiences with{" "}
          <span className="text-primary font-semibold">AI assistance</span> and{" "}
          <span className="text-primary font-semibold">smart sections</span>
        </motion.p>
      </div>
      <div className="flex items-center justify-center  gap-4 text-sm text-muted-foreground/80">
        <FloatingElement delay={0}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Hash className="w-4 h-4 text-primary" />
            <span>Smart Sections</span>
          </div>
        </FloatingElement>

        <FloatingElement delay={1}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Target className="w-4 h-4 text-primary" />
            <span>Focus Mode</span>
          </div>
        </FloatingElement>

        <FloatingElement delay={2}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Zap className="w-4 h-4 text-primary" />
            <span>Distraction Free</span>
          </div>
        </FloatingElement>

        <FloatingElement delay={3}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Assistance</span>
          </div>
        </FloatingElement>
      </div>
    </motion.div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  delay = 0,
  duration = 6,
}) => (
  <motion.div
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
);

export default HeroMain;
