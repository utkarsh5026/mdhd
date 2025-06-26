import { AnimatePresence, motion } from "framer-motion";
import { useSelectedComponents } from "@/components/features/chat-llm/hooks";
import { Badge } from "@/components/ui/badge";
import { IoClose } from "react-icons/io5";
import type { ComponentSelection } from "@/components/features/markdown-render/services/component-service";
import { getComponentColorScheme } from "../utils";
import { cn } from "@/lib/utils";

const SelectedComponents = () => {
  const { selectedComponents, removeComponent } = useSelectedComponents();

  return (
    <div className="p-3 border-b border-border bg-muted/20">
      <div className="flex flex-wrap gap-1">
        <AnimatePresence>
          {selectedComponents.map((component) => (
            <ComponentBadge
              key={component.id}
              component={component}
              onRemove={removeComponent}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ComponentBadge: React.FC<{
  component: ComponentSelection;
  onRemove?: (component: ComponentSelection) => void;
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
            onClick={() => onRemove(component)}
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
