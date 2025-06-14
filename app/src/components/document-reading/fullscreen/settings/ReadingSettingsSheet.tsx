import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Paintbrush, RotateCcw } from "lucide-react";
import { useReadingSettings } from "../context/ReadingContext";
import FontFamilySelector from "./FontFamilySelector";
import ThemeSelector from "./ThemeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReadingSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReadingSettingsSheet: React.FC<ReadingSettingsSheetProps> = ({
  open,
  onOpenChange,
}) => {
  const { resetSettings } = useReadingSettings();

  const handleReset = () => {
    resetSettings();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg font-cascadia-code px-4 flex flex-col h-full max-h-full"
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-cascadia-code flex items-center gap-2">
              <Paintbrush className="h-4 w-4" />
              Reading Settings
            </SheetTitle>
          </div>
          <SheetDescription>
            Customize your reading experience 🤗
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <Tabs defaultValue="text" className="w-full p-4">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="text" className="flex-1">
                Text
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1">
                Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="flex flex-col gap-12 p-4">
              <FontFamilySelector />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <ThemeSelector />
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <Button
            onClick={handleReset}
            variant="default"
            className="w-full flex items-center rounded-2xl bg-primary/60 text-accent-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ReadingSettingsSheet;
