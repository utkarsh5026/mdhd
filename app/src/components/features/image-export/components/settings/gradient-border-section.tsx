import React from 'react';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import type { SharedExportSettings } from '../../store/types';
import { GRADIENT_BORDER_PRESETS } from '../constants';
import { CollapsibleSection, ColorSwatchGrid, SliderRow } from './shared-controls';

export const GradientBorderSection: React.FC<{
  settings: SharedExportSettings;
  updateSettings: (partial: Partial<SharedExportSettings>) => void;
  onReset?: () => void;
}> = ({ settings, updateSettings, onReset }) => (
  <CollapsibleSection title="Gradient Border" defaultOpen={false} onReset={onReset}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Enable</span>
        <Switch
          checked={settings.gradientBorderEnabled}
          onCheckedChange={(v) => updateSettings({ gradientBorderEnabled: v })}
        />
      </div>

      {settings.gradientBorderEnabled && (
        <>
          {/* Gradient border presets */}
          <div className="flex flex-wrap gap-1.5">
            {GRADIENT_BORDER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                className={cn(
                  'w-6 h-6 rounded cursor-pointer transition-all duration-200 border-2 shadow-sm',
                  settings.gradientBorderColorStart === preset.start &&
                    settings.gradientBorderColorEnd === preset.end
                    ? 'border-primary ring-2 ring-primary/25 scale-110'
                    : 'border-transparent hover:scale-110 hover:shadow-md'
                )}
                style={{
                  background: `linear-gradient(${preset.angle}deg, ${preset.start}, ${preset.end})`,
                }}
                onClick={() =>
                  updateSettings({
                    gradientBorderColorStart: preset.start,
                    gradientBorderColorEnd: preset.end,
                    gradientBorderAngle: preset.angle,
                  })
                }
                title={preset.name}
              />
            ))}
          </div>

          <SliderRow
            label="Width"
            value={settings.gradientBorderWidth}
            onChange={(v) => updateSettings({ gradientBorderWidth: v })}
            min={1}
            max={10}
            step={1}
            unit="px"
          />

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Start color</div>
            <ColorSwatchGrid
              selected={settings.gradientBorderColorStart}
              onSelect={(color) => updateSettings({ gradientBorderColorStart: color })}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">End color</div>
            <ColorSwatchGrid
              selected={settings.gradientBorderColorEnd}
              onSelect={(color) => updateSettings({ gradientBorderColorEnd: color })}
            />
          </div>

          <SliderRow
            label="Angle"
            value={settings.gradientBorderAngle}
            onChange={(v) => updateSettings({ gradientBorderAngle: v })}
            min={0}
            max={360}
            step={15}
            unit="°"
          />
        </>
      )}
    </div>
  </CollapsibleSection>
);
