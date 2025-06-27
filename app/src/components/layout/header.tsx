import { motion } from "framer-motion";
import { Hash } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { FaGithub } from "react-icons/fa";
import ThemeSelector from "../shared/theme/components/theme-selector";
import { useTheme } from "@/hooks";

const Header = () => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
              <Hash className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              MDHD
            </span>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </motion.div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-transparent rounded-full hover:text-primary hover:border-primary cursor-pointer hover:scale-105 transition-all duration-300"
              onClick={() =>
                window.open("https://github.com/utkarsh5026/mdhd", "_blank")
              }
            >
              <FaGithub className="w-4 h-4" />
              <span className="hidden md:inline">GitHub</span>
            </Button>
            <ThemeSelector
              currentTheme={currentTheme.name}
              onThemeChange={setTheme}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
