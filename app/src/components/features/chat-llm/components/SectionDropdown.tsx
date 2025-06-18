import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { IoChevronDown, IoSearch } from "react-icons/io5";
import type { MarkdownSection } from "@/services/section/parsing";

interface SectionDropdownProps {
  sectionsDropdownOpen: boolean;
  setSectionsDropdownOpen: (open: boolean) => void;
  rag: any;
  selectedSections: string[];
  sectionsFilter: string;
  setSectionsFilter: (filter: string) => void;
  filteredSections: MarkdownSection[];
  handleSectionToggle: (sectionId: string) => void;
  currentSection: MarkdownSection | null;
}
const SectionDropdown: React.FC<SectionDropdownProps> = ({
  sectionsDropdownOpen,
  setSectionsDropdownOpen,
  rag,
  selectedSections,
  sectionsFilter,
  setSectionsFilter,
  filteredSections,
  handleSectionToggle,
  currentSection,
}) => {
  return (
    <DropdownMenu
      open={sectionsDropdownOpen}
      onOpenChange={setSectionsDropdownOpen}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-9 text-xs rounded-2xl"
          disabled={!rag.isInitialized}
        >
          <span className="text-xs truncate text-muted-foreground">
            {selectedSections.length === 0
              ? "Select..."
              : `${selectedSections.length} selected`}
          </span>
          <IoChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 rounded-2xl border-none shadow-none font-cascadia-code"
        align="start"
      >
        <div className="p-3">
          <div className="relative mb-2">
            <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Filter sections..."
              value={sectionsFilter}
              onChange={(e) => setSectionsFilter(e.target.value)}
              className="pl-7 h-8 text-xs rounded-2xl border-none"
            />
          </div>
        </div>
        <ScrollArea className="max-h-64">
          {filteredSections.map((section) => (
            <DropdownMenuItem
              key={section.id}
              className="flex items-start gap-3 p-3 cursor-pointer rounded-2xl border-none text-xs"
              onSelect={(e) => {
                e.preventDefault();
                handleSectionToggle(section.id);
              }}
            >
              <Checkbox
                checked={selectedSections.includes(section.id)}
                onChange={() => handleSectionToggle(section.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center",
                      section.level === 1
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  ></div>
                  <span className="font-medium text-xs break-words text-muted-foreground">
                    {section.title}
                  </span>
                  {currentSection?.id === section.id && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-primary/10 border-primary/30"
                    >
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SectionDropdown;
