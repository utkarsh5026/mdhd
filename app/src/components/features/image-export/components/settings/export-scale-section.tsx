import React from 'react';

import type { SharedExportSettings } from '../../store/types';
import { CollapsibleSection, SliderRow } from './shared-controls';

export const ExportScaleSection: React.FC<{
  settings: SharedExportSettings;
  updateSettings: (partial: Partial<SharedExportSettings>) => void;
  onReset?: () => void;
}> = ({ settings, updateSettings, onReset }) => (
  <CollapsibleSection title="Export" onReset={onReset}>
    <div className="space-y-4">
      <SliderRow
        label="Scale"
        value={settings.exportScale}
        onChange={(v) => updateSettings({ exportScale: v })}
        min={1}
        max={4}
        step={1}
        unit="x"
      />
    </div>
  </CollapsibleSection>
);
