import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Folder, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import getTopicIcon from "@/components/shared/icons/topicIcon";
import { fromSnakeToTitleCase } from "@/utils/string";
import { useState } from "react";

interface NavigationButtonProps {
  direction: "previous" | "next";
  onClick: () => void;
  document?: { title: string; path: string } | null;
  canNavigate: boolean;
  isMobile: boolean;
}

interface TreeNode {
  name: string;
  pathSoFar: string;
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
      pathSoFar: pathSoFar,
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

const TreeItem: React.FC<{ node: TreeNode }> = ({ node }) => {
  const Icon = node.icon || (node.type === "folder" ? Folder : FileText);

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary/5 transition-colors duration-200"
        style={{ marginLeft: `${node.depth * 16}px` }}
      >
        <div className="flex-shrink-0">
          <Icon
            size={14}
            className={`transition-colors duration-200 ${
              node.type === "folder" ? "text-primary/80" : "text-emerald-500"
            }`}
          />
        </div>
        <span
          className={`text-xs font-medium transition-colors duration-200 ${
            node.type === "folder" ? "text-foreground/80" : "text-primary/90"
          }`}
        >
          {fromSnakeToTitleCase(node.name)}
        </span>
        {node.type === "file" && (
          <div className="ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
      {node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeItem key={`${child.name}-${index}`} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const NavigationButton: React.FC<NavigationButtonProps> = ({
  direction,
  onClick,
  document,
  canNavigate,
  isMobile,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  if (!canNavigate || isMobile) return null;

  const isPrevious = direction === "previous";
  const Icon = isPrevious ? ChevronLeft : ChevronRight;
  const label = isPrevious ? "Previous" : "Next";
  const defaultTitle = isPrevious ? "Previous Document" : "Next Document";

  // Get topic icon based on document path
  const TopicIcon = document?.path
    ? getTopicIcon(document.path.split("/").slice(0, -1).join("/"), 16)
    : null;

  const getDocumentCategory = (path: string) => {
    const parts = path.split("/");
    return parts[0] || "General";
  };

  const documentCategory = document?.path
    ? getDocumentCategory(document.path)
    : "";

  // Build directory tree for hover effect
  const directoryTree = document?.path
    ? buildDirectoryTree(document.path)
    : null;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "z-20 group cursor-pointer relative overflow-hidden",
          // Enhanced glassmorphism styling
          "backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent",
          "dark:from-white/10 dark:via-white/5 dark:to-transparent",
          "border border-white/20 dark:border-white/10",
          "shadow-2xl shadow-black/10 dark:shadow-black/25",
          // Mobile: circular button
          "w-12 h-12 rounded-2xl md:rounded-3xl",
          // Desktop: expanded button with text
          "md:w-auto md:h-auto md:px-5 md:py-4 md:min-w-[220px]",
          isPrevious ? "md:-translate-x-6" : "md:translate-x-6",
          "transition-all duration-500 ease-out",
          "hover:shadow-3xl hover:shadow-primary/20",
          "hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:via-primary/2 hover:to-transparent",
          "flex items-center justify-center gap-3",
          isPrevious ? "md:justify-start" : "md:justify-end",
          "hover:scale-105 active:scale-95 md:hover:scale-102",
          "before:absolute before:inset-0 before:rounded-3xl before:p-[1px]",
          "before:bg-gradient-to-br before:from-primary/20 before:via-transparent before:to-primary/10",
          "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
        )}
        initial={{ opacity: 0, x: isPrevious ? -30 : 30, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ y: -2 }}
      >
        {/* Glassmorphism background overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
          initial={false}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          {isPrevious && (
            <Icon className="h-5 w-5 text-primary/80 group-hover:text-primary flex-shrink-0 transition-colors duration-300" />
          )}

          <div
            className={cn(
              "hidden md:block min-w-0 flex-1",
              isPrevious ? "text-left" : "text-right"
            )}
          >
            {/* Category context */}
            {documentCategory && (
              <div className="flex items-center gap-1.5 mb-1">
                {TopicIcon && (
                  <div className="flex-shrink-0 opacity-70 group-hover:opacity-90 transition-opacity">
                    {TopicIcon}
                  </div>
                )}
                <span className="text-xs text-muted-foreground/80 group-hover:text-muted-foreground transition-colors duration-300">
                  {fromSnakeToTitleCase(documentCategory)}
                </span>
              </div>
            )}

            {/* Navigation label */}
            <p className="text-xs text-primary/70 group-hover:text-primary font-medium mb-0.5 transition-colors duration-300">
              {label}
            </p>

            {/* Document title */}
            <p className="text-sm font-semibold text-foreground/90 group-hover:text-foreground truncate max-w-[180px] transition-colors duration-300">
              {document?.title ?? defaultTitle}
            </p>
          </div>

          {!isPrevious && (
            <Icon className="h-5 w-5 text-primary/80 group-hover:text-primary flex-shrink-0 transition-colors duration-300" />
          )}
        </div>
      </motion.button>

      {/* Directory Tree Hover Effect */}
      {isHovering && directoryTree && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute top-full mt-4 z-30",
            "w-80 max-w-sm",
            // Glassmorphism styling
            "backdrop-blur-xl bg-gradient-to-br from-card/90 via-card/80 to-card/90",
            "dark:from-card/90 dark:via-card/80 dark:to-card/90",
            "border border-border/40 shadow-2xl shadow-black/10 dark:shadow-black/25",
            "rounded-2xl p-4",
            // Positioning
            isPrevious ? "left-0" : "right-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <span className="text-xs font-semibold text-foreground/90">
              Document Path
            </span>
          </div>

          {/* Tree Content */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40">
            <TreeItem node={directoryTree} />
          </div>

          {/* Arrow pointer */}
          <div
            className={cn(
              "absolute -top-2 w-4 h-4 rotate-45",
              "bg-gradient-to-br from-card/90 to-card/80",
              "border-l border-t border-border/40",
              isPrevious ? "left-8" : "right-8"
            )}
          />
        </motion.div>
      )}
    </div>
  );
};

export default NavigationButton;
