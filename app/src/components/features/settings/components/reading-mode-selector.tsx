import React from 'react';
import { BookOpen, Focus, Layers, ScrollText } from 'lucide-react';
import {
  useIsZenMode,
  useZenModeActions,
  useReadingMode,
  useReadingModeActions,
} from '@/components/features/content-reading/store/use-reading-store';
import { useActiveTabId, useTabsActions } from '@/components/features/tabs/store/tabs-store';
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
  const isZenMode = useIsZenMode();
  const { toggleZenMode } = useZenModeActions();
  const globalReadingMode = useReadingMode();
  const { toggleReadingMode } = useReadingModeActions();

  // Get active tab info to also update tab-specific reading state
  const activeTabId = useActiveTabId();
  const { updateTabReadingState, getTabById } = useTabsActions();

  // Use the active tab's reading mode if available, otherwise use global
  const activeTab = activeTabId ? getTabById(activeTabId) : null;
  const readingMode = activeTab?.readingState.readingMode ?? globalReadingMode;

  const handleModeSelect = (mode: 'card' | 'scroll') => {
    if (readingMode !== mode) {
      // Update global reading store (for fullscreen mode)
      toggleReadingMode();

      // Also update the active tab's reading state (for inline viewer)
      if (activeTabId) {
        updateTabReadingState(activeTabId, { readingMode: mode });
      }
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
          onCheckedChange={() => toggleZenMode()}
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
