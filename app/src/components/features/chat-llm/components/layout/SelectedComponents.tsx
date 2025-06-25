import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useActiveConversation, useComponent } from "../../hooks";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { IoClose } from "react-icons/io5";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import { getComponentColorScheme } from "../utils";
import { cn } from "@/lib/utils";

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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="group"
    >
      <Badge
        variant="default"
        className={cn(
          "text-xs pr-1 cursor-pointer transition-colors border-none rounded-full",
          getComponentColorScheme(component.type)
        )}
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
