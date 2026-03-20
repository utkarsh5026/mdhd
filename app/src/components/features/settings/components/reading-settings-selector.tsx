import { Loader2, Paintbrush } from 'lucide-react';
import React, { lazy, memo, startTransition, Suspense, useCallback, useState } from 'react';

import SideSheet, { SideSheetBody, SideSheetHeader } from '@/components/ui/side-sheet';
import { cn } from '@/lib/utils';

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

type TabValue = 'reading' | 'theme' | 'font' | 'code';

interface TabConfig {
  value: TabValue;
  label: string;
}

const TABS: TabConfig[] = [
  { value: 'reading', label: 'Reading' },
  { value: 'theme', label: 'Theme' },
  { value: 'font', label: 'Font' },
  { value: 'code', label: 'Code' },
];

interface ReadingSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TabContentProps {
  value: TabValue;
  activeTab: TabValue;
  onRequestCloseSheet: () => void;
}

const TabContent = memo(({ value, activeTab, onRequestCloseSheet }: TabContentProps) => {
  const isHidden = value !== activeTab;

  return (
    <div
      className={cn(
        'space-y-6 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isHidden ? 'hidden' : 'block'
      )}
      aria-hidden={isHidden}
    >
      <Suspense fallback={<TabLoader />}>
        {value === 'reading' && <ReadingModeSelector />}
        {value === 'theme' && <AppThemeSelector onRequestCloseSheet={onRequestCloseSheet} />}
        {value === 'font' && <FontFamilySelector />}
        {value === 'code' && (
          <>
            <CodeDisplaySelector />
            <div className="border-t border-border/20 pt-6 mt-6">
              <CodeThemeSelector />
            </div>
          </>
        )}
      </Suspense>
    </div>
  );
});

const ReadingSettingsSheet: React.FC<ReadingSettingsSheetProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('reading');

  const handleTabChange = (value: TabValue) => {
    startTransition(() => {
      setActiveTab(value);
    });
  };

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <SideSheet open={open} onOpenChange={onOpenChange} size="lg" className="font-cascadia-code">
      <SideSheetHeader onClose={handleClose} className="px-6 py-4 bg-card">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-primary" />
            Reading Settings
          </h2>
          <p className="text-sm text-muted-foreground">Customize your reading experience 🤗</p>
        </div>
      </SideSheetHeader>

      <div className="px-6 pt-4 pb-2 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <SideSheetBody className="overflow-y-auto px-6 py-6">
        {open &&
          TABS.map((tab) => (
            <TabContent
              key={tab.value}
              value={tab.value}
              activeTab={activeTab}
              onRequestCloseSheet={handleClose}
            />
          ))}
      </SideSheetBody>
    </SideSheet>
  );
};

export default memo(ReadingSettingsSheet);
