import { fromSnakeToTitleCase } from "@/utils/string";
import { Clock, LayoutList } from "lucide-react";
import { motion } from "framer-motion";
import useMobile from "@/hooks/device/use-mobile";

interface HeaderProps {
  categoryIcon: React.ReactNode;
  category: string;
  estimatedReadTime: string;
  totalSections: number;
  documentTitle: string;
}

const Header: React.FC<HeaderProps> = ({
  categoryIcon,
  category,
  estimatedReadTime,
  totalSections,
  documentTitle,
}) => {
  const { isMobile } = useMobile();
  return (
    <div className="pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4 relative">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-5">
        {/* Category Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center">
            <div className="rounded-full px-2.5 sm:px-3 py-1 flex items-center shadow-xl text-xs sm:text-sm from-primary/90 to-primary/50 bg-gradient-to-r text-transparent bg-clip-text">
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, 0],
                }}
                transition={{
                  opacity: { delay: 0.1, duration: 0.4 },
                  x: { delay: 0.1, duration: 0.4 },
                  scale: {
                    delay: 0.5,
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  },
                  rotate: {
                    delay: 0.5,
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  },
                }}
                className="mr-1.5 sm:mr-2"
              >
                {categoryIcon}
              </motion.span>
              <span className="font-black text-xs sm:text-sm">
                {fromSnakeToTitleCase(category).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Desktop Stats */}
          {!isMobile && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center px-2 py-1 rounded-md bg-secondary/10">
                <Clock className="h-3 w-3 mr-1.5" />
                {estimatedReadTime} min read
              </div>

              <div className="flex items-center px-2 py-1 rounded-md bg-secondary/10">
                <LayoutList className="h-3 w-3 mr-1.5" />
                {totalSections} sections
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-5 leading-tight text-pretty text-foreground/90">
        {documentTitle}
      </h1>
    </div>
  );
};

export default Header;
