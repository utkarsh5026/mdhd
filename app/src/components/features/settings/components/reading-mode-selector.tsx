import {
  BookOpen,
  Focus,
  Layers,
  MousePointerClick,
  ScanEye,
  ScrollText,
  SkipForward,
  Type,
  Volume2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useActiveTab, useTabsActions } from '@/components/features/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import type { TextSizeScale } from '../store/reading-settings-store';
import { useReadingSettingsStore } from '../store/reading-settings-store';
import { SettingsHeader } from './settings-commons';

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
  const ttsSpeed = useReadingSettingsStore((s) => s.settings.ttsSpeed);
  const setTtsSpeed = useReadingSettingsStore((s) => s.setTtsSpeed);
  const ttsVoiceName = useReadingSettingsStore((s) => s.settings.ttsVoiceName);
  const setTtsVoiceName = useReadingSettingsStore((s) => s.setTtsVoiceName);
  const ttsAutoAdvance = useReadingSettingsStore((s) => s.settings.ttsAutoAdvance);
  const toggleTtsAutoAdvance = useReadingSettingsStore((s) => s.toggleTtsAutoAdvance);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!ttsSupported) return;
    const load = () => {
      const available = speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, [ttsSupported]);

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

      {/* Text-to-Speech settings */}
      {ttsSupported && (
        <div className="space-y-3 pt-2 border-t border-border/30">
          <SettingsHeader
            icon={<Volume2 className="h-4 w-4 text-primary" />}
            title="Text-to-Speech"
            description="Read sections aloud with narration"
          />

          <div className="-mx-2">
            <ToggleRow
              icon={<SkipForward className="h-4 w-4" />}
              title="Auto-Advance"
              description="Move to next section when narration ends"
              checked={ttsAutoAdvance}
              onToggle={toggleTtsAutoAdvance}
            />
          </div>

          {/* Default speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">Default Speed</span>
              <span className="text-xs font-medium tabular-nums">{ttsSpeed.toFixed(1)}x</span>
            </div>
            <Slider
              min={0.5}
              max={2.0}
              step={0.1}
              value={[ttsSpeed]}
              onValueChange={([v]) => setTtsSpeed(v)}
            />
          </div>

          {/* Preferred voice */}
          {voices.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground px-1">Preferred Voice</div>
              <select
                value={ttsVoiceName}
                onChange={(e) => setTtsVoiceName(e.target.value)}
                className={cn(
                  'w-full rounded-lg border border-border/50 bg-muted/30 px-3 py-2',
                  'text-xs text-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-primary/50'
                )}
              >
                <option value="">System Default</option>
                {voices
                  .filter((v) => v.lang.startsWith('en'))
                  .map((v) => (
                    <option key={v.voiceURI} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                {voices
                  .filter((v) => !v.lang.startsWith('en'))
                  .map((v) => (
                    <option key={v.voiceURI} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadingModeSelector;
