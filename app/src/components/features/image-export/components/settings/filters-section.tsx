import React from 'react';

import {
  defaultPhotoSettings,
  type PhotoImageExportSettings,
} from '../../store/photo-image-export-store';
import { FILTER_KEYS, pickKeys } from '../../store/types';
import { FILTER_PRESETS } from '../constants';
import { CollapsibleSection, ColorSwatchGrid, SliderRow } from './shared-controls';

export const FiltersSection: React.FC<{
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <CollapsibleSection
    title="Filters"
    onReset={() => updateSettings(pickKeys(defaultPhotoSettings, FILTER_KEYS))}
  >
    <div className="space-y-4">
      {/* Filter presets */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.name}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-background/80 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors cursor-pointer"
            onClick={() => updateSettings({ ...preset.values })}
            title={preset.name}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <SliderRow
        label="Brightness"
        value={settings.brightness}
        onChange={(v) => updateSettings({ brightness: v })}
        min={0}
        max={200}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Contrast"
        value={settings.contrast}
        onChange={(v) => updateSettings({ contrast: v })}
        min={0}
        max={200}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Saturation"
        value={settings.saturation}
        onChange={(v) => updateSettings({ saturation: v })}
        min={0}
        max={200}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Blur"
        value={settings.blur}
        onChange={(v) => updateSettings({ blur: v })}
        min={0}
        max={20}
        step={0.5}
        unit="px"
      />

      <SliderRow
        label="Grayscale"
        value={settings.grayscale}
        onChange={(v) => updateSettings({ grayscale: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Sepia"
        value={settings.sepia}
        onChange={(v) => updateSettings({ sepia: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Hue Rotate"
        value={settings.hueRotate}
        onChange={(v) => updateSettings({ hueRotate: v })}
        min={0}
        max={360}
        step={15}
        unit="°"
      />

      <SliderRow
        label="Invert"
        value={settings.invert}
        onChange={(v) => updateSettings({ invert: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Vignette"
        value={settings.vignette}
        onChange={(v) => updateSettings({ vignette: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Sharpen"
        value={settings.sharpen}
        onChange={(v) => updateSettings({ sharpen: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <SliderRow
        label="Noise / Grain"
        value={settings.noise}
        onChange={(v) => updateSettings({ noise: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Color tint</div>
        <ColorSwatchGrid
          selected={settings.tintColor}
          onSelect={(color) =>
            updateSettings({
              tintColor: color,
              tintOpacity: Math.max(settings.tintOpacity, 15),
            })
          }
        />
        <div className="mt-3">
          <SliderRow
            label="Tint opacity"
            value={settings.tintOpacity}
            onChange={(v) => updateSettings({ tintOpacity: v })}
            min={0}
            max={60}
            step={5}
            unit="%"
          />
        </div>
      </div>
    </div>
  </CollapsibleSection>
);
