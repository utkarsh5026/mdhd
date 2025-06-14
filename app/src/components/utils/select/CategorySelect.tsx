import getIconForTech from "@/components/shared/icons";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { fromSnakeToTitleCase } from "@/utils/string";

interface CategorySelectProps {
  categories: string[];
  onCategoryChange: (category: string) => void;
  currentCategory: string;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  categories,
  onCategoryChange,
  currentCategory,
}) => {
  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
  };

  return (
    <Select
      value={currentCategory ?? "all"}
      onValueChange={(value) => handleCategoryChange(value)}
    >
      <SelectTrigger className="h-7 text-xs bg-card border-border/50 focus:ring-primary/20 focus:border-primary/30 rounded-2xl">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl font-cascadia-code">
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map((category) => {
          const Icon = getIconForTech(category);
          return (
            <SelectItem
              key={category}
              value={category}
              className="flex items-center gap-2"
            >
              <Icon className="h-3 w-3 mr-1 text-primary" />
              {fromSnakeToTitleCase(category)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default CategorySelect;
