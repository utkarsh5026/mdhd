import React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';

import { type CodeImageExportSettings, defaultSettings } from '../store/code-image-export-store';
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
  CodeSection,
  ExportScaleSection,
  GradientBorderSection,
  LayoutSection,
  LineHighlightSection,
  PerspectiveSection,
  PresetsSection,
  WatermarkSection,
  WindowSection,
} from './settings';

interface SettingsSidebarProps {
  settings: CodeImageExportSettings;
  updateSettings: (partial: Partial<CodeImageExportSettings>) => void;
  presets: SavedPreset[];
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  language: string;
  lineCount: number;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  settings,
  updateSettings,
  presets,
  savePreset,
  loadPreset,
  deletePreset,
  language,
  lineCount,
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
        onReset={() => updateSettings(pickKeys(defaultSettings, BACKGROUND_KEYS))}
      />
      <WindowSection settings={settings} updateSettings={updateSettings} language={language} />
      <CodeSection settings={settings} updateSettings={updateSettings} />
      <LineHighlightSection
        settings={settings}
        updateSettings={updateSettings}
        lineCount={lineCount}
      />
      <LayoutSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultSettings, LAYOUT_KEYS))}
      />
      <PerspectiveSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultSettings, PERSPECTIVE_KEYS))}
      />
      <GradientBorderSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultSettings, GRADIENT_BORDER_KEYS))}
      />
      <AnnotationsSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultSettings, ANNOTATION_KEYS))}
      />
      <WatermarkSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultSettings, WATERMARK_KEYS))}
      />
      <ExportScaleSection
        settings={settings}
        updateSettings={updateSettings as (p: Partial<SharedExportSettings>) => void}
        onReset={() => updateSettings(pickKeys(defaultSettings, EXPORT_KEYS))}
      />
      <div className="h-4" />
    </div>
  </ScrollArea>
);

export default SettingsSidebar;
