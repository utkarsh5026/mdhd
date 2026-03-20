import React from 'react';

import type { SharedExportSettings } from '../../store/types';
import { ASPECT_RATIOS, DEVICE_FRAME_OPTIONS, SOCIAL_MEDIA_TEMPLATES } from '../constants';
import { CollapsibleSection, SelectRow, SliderRow, ToggleGroup } from './shared-controls';

export const LayoutSection: React.FC<{
  settings: SharedExportSettings;
  updateSettings: (partial: Partial<SharedExportSettings>) => void;
  onReset?: () => void;
}> = ({ settings, updateSettings, onReset }) => (
  <CollapsibleSection title="Layout" onReset={onReset}>
    <div className="space-y-4">
      {/* Social media templates */}
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Social templates</div>
        <div className="flex flex-wrap gap-1.5">
          {SOCIAL_MEDIA_TEMPLATES.map((t) => (
            <button
              key={t.name}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-background/80 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors cursor-pointer"
              onClick={() =>
                updateSettings({
                  customWidth: t.width,
                  aspectRatio: t.aspectRatio,
                  padding: t.padding,
                  exportScale: t.exportScale,
                })
              }
              title={t.name}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <SliderRow
        label="Padding"
        value={settings.padding}
        onChange={(v) => updateSettings({ padding: v })}
        min={0}
        max={128}
        step={8}
        unit="px"
      />

      <SliderRow
        label="Custom width"
        value={settings.customWidth}
        onChange={(v) => updateSettings({ customWidth: v })}
        min={0}
        max={1920}
        step={20}
        unit={settings.customWidth > 0 ? 'px' : ''}
      />
      {settings.customWidth === 0 && (
        <div className="text-[10px] text-muted-foreground/50 -mt-1.5 italic">auto width</div>
      )}

      <SliderRow
        label="Custom height"
        value={settings.customHeight}
        onChange={(v) => updateSettings({ customHeight: v })}
        min={0}
        max={1920}
        step={20}
        unit={settings.customHeight > 0 ? 'px' : ''}
      />
      {settings.customHeight === 0 && (
        <div className="text-[10px] text-muted-foreground/50 -mt-1.5 italic">auto height</div>
      )}

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Aspect ratio</div>
        <ToggleGroup
          options={ASPECT_RATIOS}
          value={settings.aspectRatio}
          onChange={(v) =>
            updateSettings({
              aspectRatio: v as 'auto' | '16:9' | '4:3' | '1:1' | '9:16',
            })
          }
        />
      </div>

      <SelectRow
        label="Device frame"
        value={settings.deviceFrame}
        onValueChange={(v) =>
          updateSettings({ deviceFrame: v as SharedExportSettings['deviceFrame'] })
        }
        options={DEVICE_FRAME_OPTIONS}
      />
    </div>
  </CollapsibleSection>
);
