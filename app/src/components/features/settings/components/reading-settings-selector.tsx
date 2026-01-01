import React, { lazy, Suspense } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Paintbrush, RotateCcw, Loader2 } from "lucide-react";
import { useReadingSettings } from "../context/ReadingContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";


const AppThemeSelector = lazy(() => import("./app-theme-selector"));
const FontFamilySelector = lazy(() => import("./font-family-selector"));
const CodeThemeSelector = lazy(() => import("./code-theme-selector"));
const CodeDisplaySelector = lazy(() => import("./code-display-selector"));


const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

interface ReadingSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tabs = [
  {
    value: "theme",
    label: "Theme",
    className: "space-y-6 px-2",
    content: <AppThemeSelector />,
  },
  {
    value: "font",
    label: "Font",
    className: "space-y-6 px-2",
    content: <FontFamilySelector />,
  },
  {
    value: "code",
    label: "Code",
    className: "space-y-8 px-2",
    content: (
      <>
        <CodeDisplaySelector />
        <div className="border-t border-border/20 pt-6">
          <CodeThemeSelector />
        </div>
      </>
    ),
  },
] as const;

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
        className="w-full sm:max-w-2xl font-cascadia-code px-4 flex flex-col h-full max-h-full"
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
          <Tabs defaultValue="theme" className="w-full">
            <TabsList className={`w-full mb-6 grid grid-cols-${tabs.length}`}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className={tab.className}>
                <Suspense fallback={<TabLoader />}>{tab.content}</Suspense>
              </TabsContent>
            ))}
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
