import { Bookmark, Save, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { SavedPreset } from '../../store/types';
import { CollapsibleSection } from './shared-controls';

export const PresetsSection: React.FC<{
  presets: SavedPreset[];
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onSave: (name: string) => void;
}> = ({ presets, onLoad, onDelete, onSave }) => {
  const [presetName, setPresetName] = useState('');

  const handleSave = useCallback(() => {
    const name = presetName.trim();
    if (!name) return;
    onSave(name);
    setPresetName('');
  }, [presetName, onSave]);

  return (
    <CollapsibleSection title="Presets">
      <div className="space-y-2">
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-0.5 rounded-lg bg-background/80 border border-border/40 pr-0.5 transition-colors hover:border-border/70"
              >
                <button
                  className="text-xs px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
                  onClick={() => onLoad(p.name)}
                  title={`Load "${p.name}"`}
                >
                  <Bookmark className="w-3 h-3 shrink-0" />
                  {p.name}
                </button>
                <button
                  className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={() => onDelete(p.name)}
                  title={`Delete "${p.name}"`}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 gap-1 text-xs cursor-pointer"
            onClick={handleSave}
            disabled={!presetName.trim()}
          >
            <Save className="w-3 h-3" />
            Save
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
};
