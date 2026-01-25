import React, {
  lazy,
  Suspense,
  useState,
  memo,
  useEffect,
  startTransition,
  useCallback,
} from 'react';
import { Paintbrush, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleTabChange = (value: TabValue) => {
    startTransition(() => {
      setActiveTab(value);
    });
  };

  const handleRequestCloseSheet = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/80 z-40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full sm:max-w-2xl bg-background shadow-2xl border-l border-border',
          'transform transition-transform duration-300 ease-out will-change-transform font-cascadia-code',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card z-10">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-primary" />
                Reading Settings
              </h2>
              <p className="text-sm text-muted-foreground">Customize your reading experience 🤗</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="px-6 pt-4 pb-2 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
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

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {open &&
              TABS.map((tab) => (
                <TabContent
                  key={tab.value}
                  value={tab.value}
                  activeTab={activeTab}
                  onRequestCloseSheet={handleRequestCloseSheet}
                />
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(ReadingSettingsSheet);
