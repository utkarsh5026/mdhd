import React, { memo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/fast-tabs';
import { FolderTree, List } from 'lucide-react';
import { useLocalStorage } from '@/hooks';
import { cn } from '@/lib/utils';

interface TabbedSidebarProps {
  filesContent: React.ReactNode;
  tocContent: React.ReactNode;
  className?: string;
}

const SIDEBAR_TAB_KEY = 'mdhd-sidebar-tab';

export const TabbedSidebar: React.FC<TabbedSidebarProps> = memo(
  ({ filesContent, tocContent, className }) => {
    const { storedValue: activeTab, setValue: setActiveTab } = useLocalStorage(
      SIDEBAR_TAB_KEY,
      'files'
    );

    return (
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="files"
        className={cn('flex flex-col h-full', className)}
      >
        <TabsList className="w-full h-8 rounded-md bg-muted/50 mx-2 mt-2 mb-1">
          <TabsTrigger value="files" className="text-xs px-3 gap-1.5">
            <FolderTree className="h-3.5 w-3.5" />
            <span>Files</span>
          </TabsTrigger>
          <TabsTrigger value="outline" className="text-xs px-3 gap-1.5">
            <List className="h-3.5 w-3.5" />
            <span>Outline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 overflow-hidden mt-0">
          {filesContent}
        </TabsContent>

        <TabsContent value="outline" className="flex-1 overflow-hidden mt-0">
          {tocContent}
        </TabsContent>
      </Tabs>
    );
  }
);

TabbedSidebar.displayName = 'TabbedSidebar';
