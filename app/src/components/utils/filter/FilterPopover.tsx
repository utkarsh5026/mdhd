import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ListFilter,
  X,
  Filter,
  Calendar,
  Clock,
  LayoutList,
} from "lucide-react";
import { TimeRange } from "@/utils/time";
import getIconForTech from "@/components/shared/icons/iconMap";
import { fromSnakeToTitleCase } from "@/utils/string";

// Type definitions for the filter options
export type FilterOptions = {
  category?: string;
  timeRange?: TimeRange;
  status?: string;
  // Add additional filter types here as needed
};

interface FilterPopoverProps {
  // Control which filters to show
  showCategoryFilter?: boolean;
  showTimeFilter?: boolean;
  showStatusFilter?: boolean;

  // Data for filters
  categories?: string[];
  statusOptions?: {
    id: string;
    label: string;
    count?: number;
    icon?: React.ElementType;
  }[];

  // Current filter values
  currentCategory?: string;
  currentTimeRange?: TimeRange;
  currentStatus?: string;

  // Callbacks when filters change
  onCategoryChange?: (category: string) => void;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  onStatusChange?: (status: string) => void;

  // For custom filter rendering
  customFilterSections?: React.ReactNode;

  // For UI customization
  buttonVariant?: "default" | "outline" | "ghost" | "link";
  buttonSize?: "sm" | "md" | "lg";
  buttonClassName?: string;
  popoverClassName?: string;

  // Label customization
  buttonLabel?: string;
  filterTitle?: string;

  // Alternative trigger element
  triggerElement?: React.ReactNode;

  // Allow clearing all filters
  allowClear?: boolean;
  onClearFilters?: () => void;
}

/**
 * FilterPopover - A versatile filter component with animation and mobile optimization
 *
 * This component provides a unified interface for filtering data in your application.
 * It supports various filter types including categories, time ranges, and status filters.
 *
 * Features:
 * - Animated interactions for better user experience
 * - Mobile-optimized with responsive design
 * - Customizable filter options
 * - Visual indicators for active filters
 * - Support for multiple filter types
 * - Clean, modern design consistent with the application
 */
const FilterPopover: React.FC<FilterPopoverProps> = ({
  showCategoryFilter = true,
  showTimeFilter = true,
  showStatusFilter = false,

  categories = ["all"],
  statusOptions = [],

  currentCategory = "all",
  currentTimeRange = "all",
  currentStatus = "all",

  onCategoryChange,
  onTimeRangeChange,
  onStatusChange,

  customFilterSections,

  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName,
  popoverClassName,

  buttonLabel = "Filters",
  filterTitle = "Filter options",

  triggerElement,

  allowClear = true,
  onClearFilters,
}) => {
  // State to control the popover visibility
  const [isOpen, setIsOpen] = useState(false);

  // Calculate the number of active filters
  const activeFilterCount = [
    currentCategory !== "all" && showCategoryFilter,
    currentTimeRange !== "all" && showTimeFilter,
    currentStatus !== "all" && showStatusFilter,
  ].filter(Boolean).length;

  // Check if there are any active filters
  const hasActiveFilters = activeFilterCount > 0;

  // Handle clearing all filters
  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
      return;
    }

    if (onCategoryChange && showCategoryFilter) {
      onCategoryChange("all");
    }

    if (onTimeRangeChange && showTimeFilter) {
      onTimeRangeChange("all");
    }

    if (onStatusChange && showStatusFilter) {
      onStatusChange("all");
    }
  };

  // Generate the filter sections
  const filterSections: React.ReactNode[] = [];

  // Status filter section
  if (showStatusFilter && statusOptions.length > 0 && onStatusChange) {
    filterSections.push(
      <div key="status-filter" className="mb-4">
        <div className="mb-2 text-xs text-muted-foreground flex items-center">
          <LayoutList className="h-3.5 w-3.5 mr-1.5 text-primary/70" /> Status
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {statusOptions.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start text-xs rounded-lg h-8",
                currentStatus === option.id && "bg-primary/10 font-medium"
              )}
              onClick={() => onStatusChange(option.id)}
            >
              {option.icon && <option.icon className="h-3.5 w-3.5 mr-2" />}
              {option.label} {option.count !== undefined && `(${option.count})`}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Category filter section
  if (showCategoryFilter && categories.length > 0 && onCategoryChange) {
    filterSections.push(
      <div
        key="category-filter"
        className={cn(
          filterSections.length > 0 ? "border-t border-border/30 pt-3" : ""
        )}
      >
        <div className="mb-2 text-xs text-muted-foreground flex items-center">
          <Filter className="h-3.5 w-3.5 mr-1.5 text-primary/70" /> Category
        </div>
        <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "justify-start text-xs rounded-lg h-8",
              currentCategory === "all" && "bg-primary/10 font-medium"
            )}
            onClick={() => onCategoryChange("all")}
          >
            <LayoutList className="h-3.5 w-3.5 mr-2" /> All Categories
          </Button>
          {categories
            .filter((c) => c !== "all")
            .map((category) => {
              const CategoryIcon = getIconForTech(category);
              return (
                <Button
                  key={category}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "justify-start text-xs rounded-lg h-8",
                    currentCategory === category && "bg-primary/10 font-medium"
                  )}
                  onClick={() => onCategoryChange(category)}
                >
                  <CategoryIcon className="h-3.5 w-3.5 mr-2" />
                  {fromSnakeToTitleCase(category)}
                </Button>
              );
            })}
        </div>
      </div>
    );
  }

  // Time range filter section
  if (showTimeFilter && onTimeRangeChange) {
    const timeOptions: {
      id: TimeRange;
      label: string;
      icon: React.ElementType;
    }[] = [
      { id: "all", label: "All Time", icon: Clock },
      { id: "today", label: "Today", icon: Calendar },
      { id: "week", label: "This Week", icon: Calendar },
      { id: "month", label: "This Month", icon: Calendar },
      { id: "quarter", label: "This Quarter", icon: Calendar },
      { id: "year", label: "This Year", icon: Calendar },
    ];

    filterSections.push(
      <div
        key="time-filter"
        className={cn(
          filterSections.length > 0 ? "border-t border-border/30 pt-3" : ""
        )}
      >
        <div className="mb-2 text-xs text-muted-foreground flex items-center">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/70" /> Time Range
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {timeOptions.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start text-xs rounded-lg h-8",
                currentTimeRange === option.id && "bg-primary/10 font-medium"
              )}
              onClick={() => onTimeRangeChange(option.id)}
            >
              <option.icon className="h-3.5 w-3.5 mr-2" />
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Add custom filter sections if provided
  if (customFilterSections) {
    filterSections.push(
      <div
        key="custom-filters"
        className={cn(
          filterSections.length > 0 ? "border-t border-border/30 pt-3" : ""
        )}
      >
        {customFilterSections}
      </div>
    );
  }

  // Create the trigger button if no custom trigger is provided
  const defaultTrigger = (
    <Button
      variant={buttonVariant}
      size={buttonSize === "md" ? "default" : buttonSize}
      className={cn(
        "text-xs rounded-lg relative flex items-center gap-1.5",
        hasActiveFilters
          ? "bg-primary/10 border-primary/20 hover:bg-primary/15"
          : "bg-secondary/20 hover:bg-secondary/30",
        buttonClassName
      )}
    >
      <ListFilter className="h-3.5 w-3.5" />
      {buttonLabel}
      {hasActiveFilters && (
        <Badge
          className="h-5 absolute -top-2 -right-2 bg-primary text-xs font-normal px-1 min-w-[18px] flex items-center justify-center"
          variant="default"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {triggerElement || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[260px] p-3 rounded-2xl", popoverClassName)}
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col gap-3 text-sm font-cascadia-code">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center">
              <ListFilter className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
              {filterTitle}
            </h3>
            {hasActiveFilters && allowClear && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs hover:bg-primary/10 rounded-lg"
                onClick={handleClearFilters}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[400px] mt-1 overflow-y-auto pr-2">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {filterSections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {section}
                  </motion.div>
                ))}

                {filterSections.length === 0 && (
                  <div className="py-6 text-center text-muted-foreground">
                    <Filter className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No filter options available</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </ScrollArea>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 pt-2 border-t border-border/30 text-xs text-muted-foreground"
            >
              <div className="flex flex-wrap gap-1">
                {currentCategory !== "all" && showCategoryFilter && (
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-xs px-2 py-0.5"
                  >
                    {fromSnakeToTitleCase(currentCategory)}
                  </Badge>
                )}
                {currentTimeRange !== "all" && showTimeFilter && (
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-xs px-2 py-0.5"
                  >
                    {currentTimeRange === "today"
                      ? "Today"
                      : currentTimeRange === "week"
                      ? "This Week"
                      : currentTimeRange === "month"
                      ? "This Month"
                      : currentTimeRange === "quarter"
                      ? "This Quarter"
                      : currentTimeRange === "year"
                      ? "This Year"
                      : "All Time"}
                  </Badge>
                )}
                {currentStatus !== "all" && showStatusFilter && (
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-xs px-2 py-0.5"
                  >
                    {statusOptions.find((o) => o.id === currentStatus)?.label ||
                      currentStatus}
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPopover;
