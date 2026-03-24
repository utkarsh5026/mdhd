import React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';

import type { PhotoImageExportSettings } from '../store/photo-image-export-store';
import { defaultPhotoSettings } from '../store/photo-image-export-store';
import type { SavedPreset, SharedExportSettings } from '../store/types';
import {
  ANNOTATION_KEYS,
  BACKGROUND_KEYS,
  EXPORT_KEYS,
  GRADIENT_BORDER_KEYS,
  LAYOUT_KEYS,
  PERSPECTIVE_KEYS,
  pickKeys,
  WATERMARK_KEYS,
} from '../store/types';
import {
  AnnotationsSection,
  BackgroundSection,
  CaptionSection,
  ExportScaleSection,
  FiltersSection,
  FrameSection,
  GradientBorderSection,
  LayoutSection,
  PerspectiveSection,
  PresetsSection,
  WatermarkSection,
} from './settings';

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
      <PerspectiveSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, PERSPECTIVE_KEYS))}
      />
      <GradientBorderSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, GRADIENT_BORDER_KEYS))}
      />
      <AnnotationsSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultPhotoSettings, ANNOTATION_KEYS))}
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
