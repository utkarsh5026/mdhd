import React from 'react';
import { BookOpen, Focus, Layers, ScrollText } from 'lucide-react';
import { useActiveTab, useTabsActions } from '@/components/features/tabs';
import { SettingsHeader, SettingToggle, SelectableOption } from './settings-commons';

const READING_MODE_OPTIONS = [
  {
    mode: 'card' as const,
    icon: Layers,
    title: 'Card Mode',
    description: 'Navigate section by section with swipe gestures. Best for focused reading.',
  },
  {
    mode: 'scroll' as const,
    icon: ScrollText,
    title: 'Scroll Mode',
    description: 'Continuous scrolling through all content. Best for quick scanning.',
  },
] as const;

const ReadingModeSelector: React.FC = () => {
  const activeTab = useActiveTab();
  const { updateTabReadingState } = useTabsActions();

  // Get state from active tab (single source of truth)
  const isZenMode = activeTab?.readingState.isZenMode ?? false;
  const readingMode = activeTab?.readingState.readingMode ?? 'card';

  const handleZenModeToggle = () => {
    if (activeTab) {
      updateTabReadingState(activeTab.id, {
        isZenMode: !isZenMode,
        zenControlsVisible: false,
      });
    }
  };

  const handleModeSelect = (mode: 'card' | 'scroll') => {
    if (activeTab && readingMode !== mode) {
      updateTabReadingState(activeTab.id, { readingMode: mode });
    }
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        icon={<BookOpen className="h-4 w-4 text-primary" />}
        title="Reading Mode"
        description="Control how you read content"
      />

      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Focus Mode
        </div>
        <SettingToggle
          icon={<Focus className="h-4 w-4" />}
          title="Zen Mode"
          description="Hide all UI controls for distraction-free reading"
          checked={isZenMode}
          onCheckedChange={handleZenModeToggle}
        />
      </div>

      {/* Reading Mode Selection */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Navigation Style
        </div>
        <div className="space-y-2">
          {READING_MODE_OPTIONS.map(({ mode, icon: Icon, title, description }) => (
            <SelectableOption
              key={mode}
              icon={<Icon className="h-4 w-4" />}
              title={title}
              description={description}
              isSelected={readingMode === mode}
              onClick={() => handleModeSelect(mode)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadingModeSelector;
