import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Hash, Target, Zap } from "lucide-react";

const Hero = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={cn("space-y-6")}
    >
      <div className="relative">
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent relative">
            MDHD
            <motion.div
              className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 blur-xl"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </span>
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent mt-4"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="space-y-4"
      >
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Transform your{" "}
          <span className="text-primary font-semibold">markdown</span> into
          focused{" "}
          <span className="text-primary font-semibold">reading sessions</span>
        </p>

        <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground/80">
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
        </div>
      </motion.div>
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

export default Hero;
