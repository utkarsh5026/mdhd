import React from 'react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { PhotoImageExportSettings } from '../store/photo-image-export-store';
import { defaultPhotoSettings } from '../store/photo-image-export-store';
import type { SavedPreset, SharedExportSettings } from '../store/types';
import {
  BACKGROUND_KEYS,
  CAPTION_KEYS,
  EXPORT_KEYS,
  FILTER_KEYS,
  FRAME_KEYS,
  LAYOUT_KEYS,
  pickKeys,
  WATERMARK_KEYS,
} from '../store/types';
import { BORDER_STYLES, CAPTION_POSITIONS, FILTER_PRESETS } from './constants';
import {
  BackgroundSection,
  ExportScaleSection,
  LayoutSection,
  PresetsSection,
  WatermarkSection,
} from './settings-sidebar';
import { CollapsibleSection, ColorSwatchGrid, SliderRow, ToggleGroup } from './shared-controls';

const FiltersSection: React.FC<{
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
    </div>
  </CollapsibleSection>
);

const FrameSection: React.FC<{
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
}> = ({ settings, updateSettings }) => (
  <CollapsibleSection
    title="Frame"
    onReset={() => updateSettings(pickKeys(defaultPhotoSettings, FRAME_KEYS))}
  >
    <div className="space-y-4">
      <SliderRow
        label="Border width"
        value={settings.frameBorderWidth}
        onChange={(v) => updateSettings({ frameBorderWidth: v })}
        min={0}
        max={20}
        step={1}
        unit="px"
      />

      {settings.frameBorderWidth > 0 && (
        <>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Border style</div>
            <ToggleGroup
              options={BORDER_STYLES}
              value={settings.frameBorderStyle}
              onChange={(v) =>
                updateSettings({
                  frameBorderStyle: v as 'solid' | 'double' | 'groove' | 'ridge',
                })
              }
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Border color</div>
            <ColorSwatchGrid
              selected={settings.frameBorderColor}
              onSelect={(color) => updateSettings({ frameBorderColor: color })}
            />
          </div>
        </>
      )}

      <SliderRow
        label="Border radius"
        value={settings.innerBorderRadius}
        onChange={(v) => updateSettings({ innerBorderRadius: v })}
        min={0}
        max={32}
        step={2}
        unit="px"
      />

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Shadow</div>
        <ToggleGroup
          options={[
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'S' },
            { value: 'md', label: 'M' },
            { value: 'lg', label: 'L' },
            { value: 'xl', label: 'XL' },
          ]}
          value={settings.shadowSize}
          onChange={(v) =>
            updateSettings({
              shadowSize: v as 'none' | 'sm' | 'md' | 'lg' | 'xl',
            })
          }
        />
      </div>
    </div>
  </CollapsibleSection>
);

const CaptionSection: React.FC<{
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
  alt: string;
}> = ({ settings, updateSettings, alt }) => (
  <CollapsibleSection
    title="Caption"
    onReset={() => updateSettings(pickKeys(defaultPhotoSettings, CAPTION_KEYS))}
  >
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Text</div>
        <Input
          value={settings.captionText}
          onChange={(e) => updateSettings({ captionText: e.target.value })}
          placeholder={alt || 'Image caption...'}
          className="h-7 text-xs"
        />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Position</div>
        <ToggleGroup
          options={CAPTION_POSITIONS}
          value={settings.captionPosition}
          onChange={(v) =>
            updateSettings({
              captionPosition: v as 'below' | 'overlay-bottom' | 'overlay-top',
            })
          }
        />
      </div>

      <SliderRow
        label="Font size"
        value={settings.captionFontSize}
        onChange={(v) => updateSettings({ captionFontSize: v })}
        min={10}
        max={24}
        step={1}
        unit="px"
      />

      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Text color</div>
        <ColorSwatchGrid
          selected={settings.captionColor}
          onSelect={(color) => updateSettings({ captionColor: color })}
        />
      </div>

      {settings.captionPosition !== 'below' && (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Background</div>
          <ColorSwatchGrid
            selected={settings.captionBackground}
            onSelect={(color) => updateSettings({ captionBackground: color })}
          />
        </div>
      )}
    </div>
  </CollapsibleSection>
);

interface PhotoSettingsSidebarProps {
  settings: PhotoImageExportSettings;
  updateSettings: (partial: Partial<PhotoImageExportSettings>) => void;
  presets: SavedPreset<PhotoImageExportSettings>[];
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  alt: string;
}

const PhotoSettingsSidebar: React.FC<PhotoSettingsSidebarProps> = ({
  settings,
  updateSettings,
  presets,
  savePreset,
  loadPreset,
  deletePreset,
  alt,
}) => (
  <ScrollArea className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/30 bg-background/80">
    <div className="p-4 space-y-4">
      <PresetsSection
        presets={presets}
        onLoad={loadPreset}
        onDelete={deletePreset}
        onSave={savePreset}
      />
      <BackgroundSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, BACKGROUND_KEYS))}
      />
      <FiltersSection settings={settings} updateSettings={updateSettings} />
      <FrameSection settings={settings} updateSettings={updateSettings} />
      <CaptionSection settings={settings} updateSettings={updateSettings} alt={alt} />
      <LayoutSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, LAYOUT_KEYS))}
      />
      <WatermarkSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, WATERMARK_KEYS))}
      />
      <ExportScaleSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, EXPORT_KEYS))}
      />
      <div className="h-4" />
    </div>
  </ScrollArea>
);

export default PhotoSettingsSidebar;
