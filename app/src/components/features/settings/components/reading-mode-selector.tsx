import {
  BookOpen,
  Focus,
  Layers,
  MousePointerClick,
  ScanEye,
  ScrollText,
  Type,
} from 'lucide-react';
import React from 'react';

import { useActiveTab, useTabsActions } from '@/components/features/tabs';
import { cn } from '@/lib/utils';

import type { TextSizeScale } from '../store/reading-settings-store';
import { useReadingSettingsStore } from '../store/reading-settings-store';
import { SettingsHeader, SettingToggle } from './settings-commons';
import TtsSelector from './tts-selector';

const TEXT_SIZE_OPTIONS: { scale: TextSizeScale; label: string; name: string }[] = [
  { scale: 'xs', label: 'XS', name: 'Extra Small' },
  { scale: 'sm', label: 'S', name: 'Small' },
  { scale: 'base', label: 'M', name: 'Medium' },
  { scale: 'lg', label: 'L', name: 'Large' },
  { scale: 'xl', label: 'XL', name: 'Extra Large' },
];

const READING_MODE_OPTIONS = [
  {
    mode: 'card' as const,
    icon: Layers,
    label: 'Card',
    description: 'One section at a time',
  },
  {
    mode: 'scroll' as const,
    icon: ScrollText,
    label: 'Scroll',
    description: 'Continuous reading',
  },
] as const;

const ReadingModeSelector: React.FC = () => {
  const activeTab = useActiveTab();
  const { updateTabReadingState } = useTabsActions();
  const bionicReading = useReadingSettingsStore((s) => s.settings.bionicReading);
  const toggleBionicReading = useReadingSettingsStore((s) => s.toggleBionicReading);
  const sentenceFocusOnHover = useReadingSettingsStore((s) => s.settings.sentenceFocusOnHover);
  const toggleSentenceFocusOnHover = useReadingSettingsStore((s) => s.toggleSentenceFocusOnHover);
  const textSizeScale = useReadingSettingsStore((s) => s.typography.textSizeScale);
  const setTextSizeScale = useReadingSettingsStore((s) => s.setTextSizeScale);

  const isZenMode = activeTab?.readingState.isZenMode ?? false;
  const readingMode = activeTab?.readingState.readingMode ?? 'card';

  const handleZenModeToggle = () => {
    if (activeTab) {
      updateTabReadingState(activeTab.id, { isZenMode: !isZenMode, zenControlsVisible: false });
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

      {/* Navigation style */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Navigation Style
        </div>
        <div className="grid grid-cols-2 gap-2">
          {READING_MODE_OPTIONS.map(({ mode, icon: Icon, label, description }) => (
            <button
              key={mode}
              onClick={() => handleModeSelect(mode)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-150 border-none',
                readingMode === mode
                  ? 'border-primary/40 bg-primary/5 text-foreground shadow-sm'
                  : 'border-border/30 bg-muted/20 text-muted-foreground hover:border-border/50 hover:bg-muted/40 hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  readingMode === mode ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div className="text-center">
                <div className="text-xs font-semibold leading-none">{label}</div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  {description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Text size */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          <Type className="h-3 w-3" />
          Text Size
        </div>
        <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/20">
          {TEXT_SIZE_OPTIONS.map(({ scale, label, name }) => (
            <button
              key={scale}
              title={name}
              onClick={() => setTextSizeScale(scale)}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150',
                textSizeScale === scale
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reading enhancements */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Enhancements
        </div>
        <div className="space-y-2">
          <SettingToggle
            icon={<Focus className="h-4 w-4" />}
            title="Zen Mode"
            description="Hide all UI for distraction-free reading"
            checked={isZenMode}
            onCheckedChange={handleZenModeToggle}
          />
          <SettingToggle
            icon={<ScanEye className="h-4 w-4" />}
            title="Bionic Reading"
            description="Bold word beginnings for visual anchors"
            checked={bionicReading}
            onCheckedChange={toggleBionicReading}
          />
          <SettingToggle
            icon={<MousePointerClick className="h-4 w-4" />}
            title="Sentence Focus"
            description="Dim other sentences on hover"
            checked={sentenceFocusOnHover}
            onCheckedChange={toggleSentenceFocusOnHover}
          />
        </div>
      </div>

      <TtsSelector />
    </div>
  );
};

export default ReadingModeSelector;
