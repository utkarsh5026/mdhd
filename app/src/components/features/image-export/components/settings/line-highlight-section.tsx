import React from 'react';

import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import {
  type CodeImageExportSettings,
  defaultSettings,
  parseHighlightedLines,
} from '../../store/code-image-export-store';
import { LINE_HIGHLIGHT_KEYS, pickKeys } from '../../store/types';
import { CollapsibleSection, ColorSwatchGrid, SliderRow } from './shared-controls';

export const LineHighlightSection: React.FC<{
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
  lineCount: number;
}> = ({ settings, updateSettings, lineCount }) => {
  const total = Math.max(lineCount, 1);

  const parsed = parseHighlightedLines(settings.highlightedLines);
  const hasSelection = parsed.length > 0;
  const rangeStart = hasSelection ? Math.min(...parsed) : 1;
  const rangeEnd = hasSelection ? Math.max(...parsed) : total;

  const handleRangeChange = ([start, end]: number[]) => {
    updateSettings({ highlightedLines: start === end ? `${start}` : `${start}-${end}` });
  };

  return (
    <CollapsibleSection
      title="Line Highlight"
      onReset={() => updateSettings(pickKeys(defaultSettings, LINE_HIGHLIGHT_KEYS))}
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {hasSelection
                ? rangeStart === rangeEnd
                  ? `Line ${rangeStart}`
                  : `Lines ${rangeStart}–${rangeEnd}`
                : 'No lines selected'}
            </span>
            {hasSelection && (
              <button
                className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                onClick={() => updateSettings({ highlightedLines: '' })}
              >
                Clear
              </button>
            )}
          </div>
          <Slider
            value={[rangeStart, rangeEnd]}
            onValueChange={handleRangeChange}
            min={1}
            max={total}
            step={1}
            minStepsBetweenThumbs={0}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground/40 tabular-nums">1</span>
            <span className="text-[10px] text-muted-foreground/40 tabular-nums">{total}</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Highlight color</div>
          <ColorSwatchGrid
            selected={settings.highlightColor}
            onSelect={(v) => updateSettings({ highlightColor: v })}
          />
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
};
