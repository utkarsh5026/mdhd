import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface StartReadingButtonProps {
  startReading: () => void;
}

const StartReadingButton: React.FC<StartReadingButtonProps> = ({
  startReading,
}) => {
  return (
    <motion.div
      className="mt-4 sm:mt-6 md:mt-8 flex justify-center px-4 sm:px-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full sm:w-auto max-w-sm sm:max-w-none"
      >
        <Button
          onClick={startReading}
          className="relative overflow-hidden group w-full sm:w-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 h-auto rounded-2xl bg-primary/60 hover:bg-primary/30 transition-colors shadow-lg sm:shadow-xl md:shadow-2xl shadow-primary/40 cursor-pointer perspective-dramatic text-sm sm:text-base touch-manipulation"
        >
          {/* Enhanced button shine effect */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full opacity-50"
            initial={{
              backgroundPosition: "0% 50%",
            }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
              backgroundSize: "200% 100%",
            }}
          />

          {/* Button content */}
          <div className="relative flex items-center justify-center">
            <motion.span
              className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5"
              animate={{ rotate: [0, 5, 0, -5], scale: [1, 1.1, 1] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
              }}
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.span>
            <span className="text-sm sm:text-base font-medium">
              Start Reading
            </span>
            <motion.div
              className="ml-1.5 sm:ml-2"
              animate={{ x: [0, 4, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.div>
          </div>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default StartReadingButton;
