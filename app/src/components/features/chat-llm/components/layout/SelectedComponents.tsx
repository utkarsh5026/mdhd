import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useActiveConversation, useComponent } from "../../hooks";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { IoClose } from "react-icons/io5";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";

const SelectedComponents = () => {
  const activeConversation = useActiveConversation();
  const { removeComponentFromConversation } = useComponent();

  /**
   * Handle removing component from active conversation
   */
  const handleRemoveComponent = useCallback(
    (componentId: string) => {
      if (!activeConversation) return;

      removeComponentFromConversation(componentId, activeConversation.id);
    },
    [activeConversation, removeComponentFromConversation]
  );

  if (!activeConversation) return null;

  return (
    <div className="p-3 border-b border-border bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Context ({activeConversation?.selectedComponents.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (activeConversation) {
              activeConversation.selectedComponents.forEach((comp) => {
                removeComponentFromConversation(comp.id, activeConversation.id);
              });
            }
          }}
          className="h-6 text-xs text-muted-foreground hover:text-destructive"
        >
          Clear All
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        <AnimatePresence>
          {activeConversation.selectedComponents.map((component) => (
            <ComponentBadge
              key={component.id}
              component={component}
              onRemove={handleRemoveComponent}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ComponentBadge: React.FC<{
  component: ComponentSelection;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}> = ({ component, onRemove, showRemove = true }) => {
  const getComponentColorScheme = (type: string) => {
    switch (type) {
      case "code":
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "table":
        return "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
      case "heading":
        return "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      case "list":
        return "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800";
      case "blockquote":
        return "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800";
      case "image":
        return "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
      default:
        return "bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="group"
    >
      <Badge
        variant="secondary"
        className={`text-xs pr-1 cursor-pointer transition-colors border ${getComponentColorScheme(
          component.type
        )}`}
      >
        <span className="max-w-32 truncate">{component.title}</span>
        {showRemove && onRemove && (
          <button
            onClick={() => onRemove(component.id)}
            className="ml-1 opacity-60 group-hover:opacity-100 hover:bg-destructive/20 rounded p-0.5 transition-all"
            title="Remove from context"
          >
            <IoClose className="w-3 h-3" />
          </button>
        )}
      </Badge>
    </motion.div>
  );
};

export default SelectedComponents;
