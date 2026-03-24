import React from 'react';

import { Input } from '@/components/ui/input';

import type { SharedExportSettings } from '../../store/types';
import { FONT_FAMILIES, WATERMARK_POSITIONS } from '../constants';
import { CollapsibleSection, ColorSwatchGrid, SelectRow, SliderRow } from './shared-controls';

export const WatermarkSection: React.FC<{
  settings: SharedExportSettings;
  updateSettings: (partial: Partial<SharedExportSettings>) => void;
  onReset?: () => void;
}> = ({ settings, updateSettings, onReset }) => (
  <CollapsibleSection title="Watermark" onReset={onReset}>
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Text</div>
        <Input
          value={settings.watermarkText}
          onChange={(e) => updateSettings({ watermarkText: e.target.value })}
          placeholder="@username"
          className="h-7 text-xs"
        />
      </div>

      {settings.watermarkText && (
        <>
          <SelectRow
            label="Position"
            value={settings.watermarkPosition}
            onValueChange={(v) =>
              updateSettings({
                watermarkPosition: v as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
              })
            }
            options={WATERMARK_POSITIONS}
          />

          <SliderRow
            label="Opacity"
            value={settings.watermarkOpacity}
            onChange={(v) => updateSettings({ watermarkOpacity: v })}
            min={10}
            max={100}
            step={5}
            unit="%"
          />

          <SliderRow
            label="Font size"
            value={settings.watermarkSize}
            onChange={(v) => updateSettings({ watermarkSize: v })}
            min={8}
            max={24}
            step={1}
            unit="px"
          />

          <SelectRow
            label="Font family"
            value={settings.watermarkFontFamily}
            onValueChange={(v) => updateSettings({ watermarkFontFamily: v })}
            options={[
              { value: 'system-ui, sans-serif', label: 'System UI' },
              ...FONT_FAMILIES.map((f) => ({ value: f, label: f })),
            ]}
            renderItem={(opt) => <span style={{ fontFamily: opt.value }}>{opt.label}</span>}
          />

          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Text color</div>
            <ColorSwatchGrid
              selected={settings.watermarkColor}
              onSelect={(color) => updateSettings({ watermarkColor: color })}
            />
          </div>
        </>
      )}
    </div>
  </CollapsibleSection>
);
