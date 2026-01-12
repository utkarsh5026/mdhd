import React, {
  createContext,
  useContext,
  useState,
  startTransition,
  useCallback,
  memo,
  useMemo,
} from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a FastTabs provider');
  }
  return context;
}

interface FastTabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Fast tabs component using startTransition for smooth tab switching.
 * Drop-in replacement for shadcn Tabs with better performance.
 */
function FastTabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: FastTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeTab = value ?? internalValue;

  const setActiveTab = useCallback(
    (newValue: string) => {
      startTransition(() => {
        if (onValueChange) {
          onValueChange(newValue);
        } else {
          setInternalValue(newValue);
        }
      });
    },
    [onValueChange]
  );

  const contextValue = useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div data-slot="tabs" className={cn('flex flex-col gap-2', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface FastTabsListProps {
  className?: string;
  children: React.ReactNode;
}

const FastTabsList = memo(function FastTabsList({
  className,
  children,
}: FastTabsListProps) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className
      )}
    >
      {children}
    </div>
  );
});

interface FastTabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const FastTabsTrigger = memo(function FastTabsTrigger({
  value,
  className,
  children,
  disabled = false,
}: FastTabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  const handleClick = useCallback(() => {
    if (!disabled) {
      setActiveTab(value);
    }
  }, [disabled, setActiveTab, value]);

  return (
    <button
      type="button"
      role="tab"
      data-slot="tabs-trigger"
      data-state={isActive ? 'active' : 'inactive'}
      aria-selected={isActive}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow]',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        isActive
          ? 'bg-background text-foreground shadow-sm dark:bg-primary/10 dark:text-primary'
          : 'text-foreground dark:text-muted-foreground',
        className
      )}
    >
      {children}
    </button>
  );
});

interface FastTabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const FastTabsContent = memo(function FastTabsContent({
  value,
  className,
  children,
}: FastTabsContentProps) {
  const { activeTab } = useTabsContext();
  const isHidden = activeTab !== value;

  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      data-state={isHidden ? 'inactive' : 'active'}
      aria-hidden={isHidden}
      className={cn(
        'flex-1 outline-none',
        isHidden ? 'hidden' : 'block animate-in fade-in-0 duration-200',
        className
      )}
    >
      {children}
    </div>
  );
});

export {
  FastTabs,
  FastTabsList,
  FastTabsTrigger,
  FastTabsContent,
  // Also export with original names for easier migration
  FastTabs as Tabs,
  FastTabsList as TabsList,
  FastTabsTrigger as TabsTrigger,
  FastTabsContent as TabsContent,
};
