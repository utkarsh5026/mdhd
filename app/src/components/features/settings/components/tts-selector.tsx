import { SkipForward, Volume2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import LabeledSelect, { type SelectOption } from '@/components/shared/labeled-select';
import { Slider } from '@/components/ui/slider';

import { useReadingSettingsStore } from '../store/reading-settings-store';
import { SettingsHeader, ToggleRow } from './settings-commons';

const TtsSelector: React.FC = () => {
  const ttsSpeed = useReadingSettingsStore((s) => s.tts.speed);
  const setTtsSpeed = useReadingSettingsStore((s) => s.setTtsSpeed);
  const ttsVoiceName = useReadingSettingsStore((s) => s.tts.voiceName);
  const setTtsVoiceName = useReadingSettingsStore((s) => s.setTtsVoiceName);
  const ttsAutoAdvance = useReadingSettingsStore((s) => s.tts.autoAdvance);
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

  if (!ttsSupported) return null;

  return (
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

      {voices.length > 0 && (
        <LabeledSelect<string>
          label="Preferred Voice"
          value={ttsVoiceName}
          onChange={setTtsVoiceName}
          placeholder="System Default"
          options={[
            { value: '', label: 'System Default' },
            ...voices.map((v): SelectOption => ({ value: v.name, label: `${v.name} (${v.lang})` })),
          ]}
        />
      )}
    </div>
  );
};

export default TtsSelector;
