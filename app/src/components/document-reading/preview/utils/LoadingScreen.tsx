import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  File,
  FileText,
  Terminal,
  Sparkles,
  Brain,
  Search,
} from "lucide-react";
import getTopicIcon from "@/components/shared/icons/topicIcon";
import { fromSnakeToTitleCase } from "@/utils/string";

interface TreeNode {
  name: string;
  pathsoFar: string;
  type: "folder" | "file";
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children?: TreeNode[];
  depth: number;
}

const buildDirectoryTree = (path: string): TreeNode => {
  const segments = path.split("/").filter(Boolean);

  const buildNode = (segmentIndex: number): TreeNode => {
    const segment = segments[segmentIndex];
    const isFile = segmentIndex === segments.length - 1;

    const pathSoFar = segments.slice(0, segmentIndex + 1).join("/");

    const node: TreeNode = {
      name: segment,
      pathsoFar: pathSoFar,
      type: isFile ? "file" : "folder",
      icon: isFile ? FileText : () => getTopicIcon(pathSoFar),
      depth: segmentIndex,
      children:
        segmentIndex < segments.length - 1
          ? [buildNode(segmentIndex + 1)]
          : undefined,
    };

    return node;
  };

  return buildNode(0);
};

const TreeItem: React.FC<{
  node: TreeNode;
  isVisible: boolean;
  delay: number;
}> = ({ node, isVisible, delay }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = node.icon || (node.type === "folder" ? Folder : File);

  useEffect(() => {
    if (isVisible && node.type === "folder") {
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, delay + 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay, node.type]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -30, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.8 }}
          transition={{
            duration: 0.5,
            delay: delay / 1000,
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
          className="space-y-1"
        >
          <div
            className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-primary/5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            style={{ marginLeft: `${node.depth * 24}px` }}
          >
            {/* Glowing background effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100"
              initial={false}
              animate={{ x: [-100, 300] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="flex-shrink-0 relative z-10"
            >
              <Icon
                size={18}
                className={`transition-all duration-300 ${
                  node.type === "folder"
                    ? "text-primary group-hover:text-primary"
                    : "text-emerald-500 group-hover:text-emerald-400"
                }`}
              />
            </motion.div>

            <motion.span
              className={`text-sm font-medium transition-all duration-300 relative z-10 ${
                node.type === "folder"
                  ? "text-foreground group-hover:text-foreground"
                  : "text-primary group-hover:text-foreground"
              }`}
            >
              {fromSnakeToTitleCase(node.name)}
            </motion.span>

            {node.type === "file" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay / 1000 + 0.3 }}
                className="ml-auto relative z-10"
              >
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(16, 185, 129, 0.7)",
                      "0 0 0 4px rgba(16, 185, 129, 0)",
                      "0 0 0 0 rgba(16, 185, 129, 0)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            )}
          </div>

          {node.children && isExpanded && (
            <div className="space-y-1">
              {node.children.map((child, index) => (
                <TreeItem
                  key={`${child.name}-${index}`}
                  node={child}
                  isVisible={isExpanded}
                  delay={delay + index * 120}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface LoadingScreenProps {
  documentPath: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ documentPath }) => {
  const [currentRootIndex, setCurrentRootIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const directoriesToShow = [buildDirectoryTree(documentPath)];

  const loadingMessages = [
    {
      icon: Search,
      text: "Scanning knowledge base...",
      subtext: "Indexing content structure",
    },
    {
      icon: Brain,
      text: "Processing information...",
      subtext: "Analyzing document relationships",
    },
    {
      icon: Sparkles,
      text: "Optimizing experience...",
      subtext: "Preparing interactive features",
    },
  ];

  // Infinite animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);

      setTimeout(() => {
        setCurrentRootIndex(
          (prevIndex) => (prevIndex + 1) % directoriesToShow.length
        );
        setLoadingPhase((prev) => (prev + 1) % loadingMessages.length);
        setIsAnimating(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [directoriesToShow.length, loadingMessages.length]);

  const currentMessage = loadingMessages[loadingPhase];
  const CurrentIcon = currentMessage.icon;

  return (
    <div className="flex flex-col justify-center items-center min-h-[600px] py-16 font-cascadia-code max-w-lg mx-auto relative">
      {/* Enhanced Header Section */}
      <motion.div
        className="text-center mb-10 space-y-4 relative z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Multi-layered loading spinner */}
        <motion.div
          className="relative w-16 h-16 mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-emerald-400 border-b-transparent border-l-emerald-400/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 w-8 h-8 mx-auto"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <CurrentIcon className="w-full h-full text-primary" />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`message-${loadingPhase}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <motion.h2
              className="text-xl font-bold bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {currentMessage.text}
            </motion.h2>
            <motion.p
              className="text-sm text-muted-foreground/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentMessage.subtext}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress indicator */}
        <motion.div
          className="flex justify-center gap-2 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {loadingMessages.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === loadingPhase ? "bg-primary" : "bg-primary/20"
              }`}
              animate={index === loadingPhase ? { scale: [1, 1.3, 1] } : {}}
              transition={{
                duration: 0.5,
                repeat: index === loadingPhase ? Infinity : 0,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Enhanced Directory Tree */}
      <motion.div
        className="w-full max-w-md bg-gradient-to-br from-card/60 via-card/40 to-card/60 backdrop-blur-xl rounded-3xl border border-border/40 p-6 shadow-2xl relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
      >
        {/* Animated background gradients */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "linear-gradient(45deg, var(--primary)/10, transparent, var(--primary)/5)",
              "linear-gradient(90deg, transparent, var(--primary)/15, transparent)",
              "linear-gradient(135deg, var(--primary)/10, transparent, var(--primary)/5)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10">
          {/* Enhanced header */}
          <motion.div
            className="flex items-center gap-3 mb-6 pb-4 border-b border-border/30"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Terminal size={20} className="text-primary/80" />
            </motion.div>
            <span className="text-sm font-semibold text-foreground/90">
              /content/
            </span>
            <motion.div
              className="ml-auto flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Tree content with enhanced animations */}
          <div className="space-y-2 min-h-[300px]">
            <AnimatePresence mode="wait">
              {isAnimating && (
                <TreeItem
                  key={`root-${currentRootIndex}`}
                  node={directoriesToShow[currentRootIndex]}
                  isVisible={isAnimating}
                  delay={0}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
