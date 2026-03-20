import React from 'react';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { type CodeImageExportSettings, defaultSettings } from '../../store/code-image-export-store';
import { LINE_HIGHLIGHT_KEYS, pickKeys } from '../../store/types';
import { HIGHLIGHT_COLOR_PRESETS } from '../constants';
import { CollapsibleSection, SliderRow } from './shared-controls';

export const LineHighlightSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <CollapsibleSection
    title="Line Highlight"
    onReset={() => updateSettings(pickKeys(defaultSettings, LINE_HIGHLIGHT_KEYS))}
  >
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Lines (e.g. 1,3-5,8)</div>
        <Input
          value={settings.highlightedLines}
          onChange={(e) => updateSettings({ highlightedLines: e.target.value })}
          placeholder="1,3-5,8"
          className="h-7 text-xs font-mono"
        />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Highlight color</div>
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/40">
          {HIGHLIGHT_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md transition-all duration-200 cursor-pointer font-medium',
                settings.highlightColor === preset.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
              onClick={() => updateSettings({ highlightColor: preset.value })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Dim other lines</span>
        <Switch
          checked={settings.dimUnhighlighted}
          onCheckedChange={(v) => updateSettings({ dimUnhighlighted: v })}
        />
      </div>

      {settings.dimUnhighlighted && (
        <SliderRow
          label="Dim opacity"
          value={settings.dimOpacity}
          onChange={(v) => updateSettings({ dimOpacity: v })}
          min={10}
          max={80}
          step={5}
          unit="%"
        />
      )}
    </div>
  </CollapsibleSection>
);
