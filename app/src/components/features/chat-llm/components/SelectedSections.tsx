import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IoClose } from "react-icons/io5";
import { MarkdownSection } from "@/services/section/parsing";

interface SelectedSectionsProps {
  getSelectedSectionsData: () => MarkdownSection[];
  currentSection: MarkdownSection;
  handleRemoveSection: (sectionId: string) => void;
}

const SelectedSections: React.FC<SelectedSectionsProps> = ({
  getSelectedSectionsData,
  currentSection,
  handleRemoveSection,
}) => {
  return (
    <div className="mb-4">
      <Label className="text-xs text-muted-foreground mb-2 block">
        Selected Sections
      </Label>
      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
        {getSelectedSectionsData().map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="group"
          >
            <Badge
              variant="secondary"
              className={cn(
                "text-xs pr-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors",
                currentSection?.id === section.id &&
                  "bg-primary/10 text-primary border-primary/30"
              )}
              onClick={() => handleRemoveSection(section.id)}
            >
              <span className="max-w-24 truncate text-muted-foreground">
                {section.title}
              </span>
              <IoClose className="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100" />
            </Badge>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SelectedSections;
