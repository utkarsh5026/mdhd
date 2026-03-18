import React from 'react';
import {
  BookOpen,
  Focus,
  Layers,
  ScrollText,
  ScanEye,
  MousePointerClick,
  Type,
} from 'lucide-react';
import { useActiveTab, useTabsActions } from '@/components/features/tabs';
import { useReadingSettingsStore } from '../store/reading-settings-store';
import type { TextSizeScale } from '../store/reading-settings-store';
import { SettingsHeader } from './settings-commons';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const TEXT_SIZE_OPTIONS: { scale: TextSizeScale; label: string; name: string }[] = [
  { scale: 'xs', label: 'XS', name: 'Extra Small' },
  { scale: 'sm', label: 'S', name: 'Small' },
  { scale: 'base', label: 'M', name: 'Medium' },
  { scale: 'lg', label: 'L', name: 'Large' },
  { scale: 'xl', label: 'XL', name: 'Extra Large' },
];

const READING_MODE_OPTIONS = [
  { mode: 'card' as const, icon: Layers, label: 'Card' },
  { mode: 'scroll' as const, icon: ScrollText, label: 'Scroll' },
] as const;

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, title, description, checked, onToggle }) => (
  <div
    className="flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group"
    onClick={onToggle}
  >
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'transition-colors',
          checked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
      >
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium leading-none mb-0.5">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} />
  </div>
);

const ReadingModeSelector: React.FC = () => {
  const activeTab = useActiveTab();
  const { updateTabReadingState } = useTabsActions();
  const bionicReading = useReadingSettingsStore((s) => s.settings.bionicReading);
  const toggleBionicReading = useReadingSettingsStore((s) => s.toggleBionicReading);
  const sentenceFocusOnHover = useReadingSettingsStore((s) => s.settings.sentenceFocusOnHover);
  const toggleSentenceFocusOnHover = useReadingSettingsStore((s) => s.toggleSentenceFocusOnHover);
  const textSizeScale = useReadingSettingsStore((s) => s.settings.textSizeScale);
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
    <div className="space-y-5">
      <SettingsHeader
        icon={<BookOpen className="h-4 w-4 text-primary" />}
        title="Reading Mode"
        description="Control how you read content"
      />

      {/* Toggles */}
      <div className="-mx-2">
        <ToggleRow
          icon={<Focus className="h-4 w-4" />}
          title="Zen Mode"
          description="Hide all UI for distraction-free reading"
          checked={isZenMode}
          onToggle={handleZenModeToggle}
        />
        <ToggleRow
          icon={<ScanEye className="h-4 w-4" />}
          title="Bionic Reading"
          description="Bold word beginnings for visual anchors"
          checked={bionicReading}
          onToggle={toggleBionicReading}
        />
        <ToggleRow
          icon={<MousePointerClick className="h-4 w-4" />}
          title="Sentence Focus"
          description="Dim other sentences on hover"
          checked={sentenceFocusOnHover}
          onToggle={toggleSentenceFocusOnHover}
        />
      </div>

      {/* Text size — segmented control */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
          <Type className="h-3 w-3" />
          Text Size
        </div>
        <div className="flex bg-muted/40 rounded-xl p-1 gap-0.5">
          {TEXT_SIZE_OPTIONS.map(({ scale, label, name }) => (
            <button
              key={scale}
              title={name}
              onClick={() => setTextSizeScale(scale)}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-150',
                textSizeScale === scale
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reading mode — segmented control */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground px-1">Navigation Style</div>
        <div className="flex bg-muted/40 rounded-xl p-1 gap-0.5">
          {READING_MODE_OPTIONS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => handleModeSelect(mode)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all duration-150',
                readingMode === mode
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadingModeSelector;
