import React, { lazy, Suspense, useState, memo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Paintbrush, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const ReadingModeSelector = lazy(() => import('./reading-mode-selector'));
const AppThemeSelector = lazy(() => import('./app-theme-selector'));
const FontFamilySelector = lazy(() => import('./font-family-selector'));
const CodeThemeSelector = lazy(() => import('./code-theme-selector'));
const CodeDisplaySelector = lazy(() => import('./code-display-selector'));

const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

interface ReadingSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabValue = 'reading' | 'theme' | 'font' | 'code';

interface TabConfig {
  value: TabValue;
  label: string;
  className: string;
}

const tabs: TabConfig[] = [
  {
    value: 'reading',
    label: 'Reading',
    className: 'space-y-6 px-2',
  },
  {
    value: 'theme',
    label: 'Theme',
    className: 'space-y-6 px-2',
  },
  {
    value: 'font',
    label: 'Font',
    className: 'space-y-6 px-2',
  },
  {
    value: 'code',
    label: 'Code',
    className: 'space-y-8 px-2 overflow-hidden min-w-0',
  },
];

const TabContentRenderer = memo(({ activeTab }: { activeTab: TabValue }) => {
  switch (activeTab) {
    case 'reading':
      return <ReadingModeSelector />;
    case 'theme':
      return <AppThemeSelector />;
    case 'font':
      return <FontFamilySelector />;
    case 'code':
      return (
        <>
          <CodeDisplaySelector />
          <div className="border-t border-border/20 pt-6">
            <CodeThemeSelector />
          </div>
        </>
      );
    default:
      return null;
  }
});

TabContentRenderer.displayName = 'TabContentRenderer';

const ReadingSettingsSheet: React.FC<ReadingSettingsSheetProps> = memo(({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('reading');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl font-cascadia-code px-4 flex flex-col h-full max-h-full overflow-hidden"
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-cascadia-code flex items-center gap-2">
              <Paintbrush className="h-4 w-4" />
              Reading Settings
            </SheetTitle>
          </div>
          <SheetDescription>Customize your reading experience 🤗</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto min-w-0 w-full max-w-full p-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabValue)}
            className="w-full min-w-0 overflow-hidden"
          >
            <TabsList className={`w-full mb-6 flex space-x-2 overflow-x-auto`}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className={tab.className}>
                <Suspense fallback={<TabLoader />}>
                  <TabContentRenderer activeTab={activeTab} />
                </Suspense>
              </TabsContent>
            ))}
          </Tabs>
        </ScrollArea>

        <SheetFooter className="mt-6"></SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

ReadingSettingsSheet.displayName = 'ReadingSettingsSheet';

export default ReadingSettingsSheet;
