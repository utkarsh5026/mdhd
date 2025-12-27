import { motion } from "framer-motion";
import { Hash, Sparkles, Target, Zap } from "lucide-react";
import { useTheme } from "@/components/shared/theme/hooks/use-theme";
import { generateThemeColors } from "@/utils/colors";
import { useMemo } from "react";

const HeroMain = () => {
  const { currentTheme } = useTheme();

  const floatingElementColors = useMemo(() => {
    return generateThemeColors(currentTheme.primary, 4);
  }, [currentTheme.primary]);

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
          <span className="text-foreground relative">
            Transform Markdown
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
        <FloatingElement delay={0} color={floatingElementColors[0]}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Hash
              className="w-4 h-4"
              style={{ color: floatingElementColors[0] }}
            />
            <span>Smart Sections</span>
          </div>
        </FloatingElement>

        <FloatingElement delay={1} color={floatingElementColors[1]}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Target
              className="w-4 h-4"
              style={{ color: floatingElementColors[1] }}
            />
            <span>Focus Mode</span>
          </div>
        </FloatingElement>

        <FloatingElement delay={2} color={floatingElementColors[2]}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Zap
              className="w-4 h-4"
              style={{ color: floatingElementColors[2] }}
            />
            <span>Distraction Free</span>
          </div>
        </FloatingElement>

        <FloatingElement delay={3} color={floatingElementColors[3]}>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 backdrop-blur-sm border border-border/50">
            <Sparkles
              className="w-4 h-4"
              style={{ color: floatingElementColors[3] }}
            />
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
  color?: string;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  delay = 0,
  duration = 6,
  color,
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
    style={{
      // Add a subtle glow effect using the generated color
      filter: color ? `drop-shadow(0 0 8px ${color}20)` : undefined,
    }}
  >
    {children}
  </motion.div>
);

export default HeroMain;
