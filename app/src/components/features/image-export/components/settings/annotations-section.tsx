import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import { Input } from '@/components/ui/input';

import type { Annotation, SharedExportSettings } from '../../store/types';
import { CollapsibleSection, SliderRow } from './shared-controls';

let annotationCounter = 0;

export const AnnotationsSection: React.FC<{
  settings: SharedExportSettings;
  updateSettings: (partial: Partial<SharedExportSettings>) => void;
  onReset?: () => void;
}> = ({ settings, updateSettings, onReset }) => {
  const addAnnotation = (type: Annotation['type']) => {
    annotationCounter++;
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}-${annotationCounter}`,
      type,
      text: type === 'numbered' ? `${settings.annotations.length + 1}` : 'Label',
      x: 50,
      y: 50,
      color: '#ffffff',
      fontSize: 13,
      ...(type === 'arrow' ? { toX: 70, toY: 70 } : {}),
    };
    updateSettings({ annotations: [...settings.annotations, newAnnotation] });
  };

  const updateAnnotation = (id: string, partial: Partial<Annotation>) => {
    updateSettings({
      annotations: settings.annotations.map((a) => (a.id === id ? { ...a, ...partial } : a)),
    });
  };

  const deleteAnnotation = (id: string) => {
    updateSettings({
      annotations: settings.annotations.filter((a) => a.id !== id),
    });
  };

  return (
    <CollapsibleSection title="Annotations" defaultOpen={false} onReset={onReset}>
      <div className="space-y-4">
        {/* Add buttons */}
        <div className="flex gap-1.5">
          {(['label', 'arrow', 'numbered'] as const).map((type) => (
            <button
              key={type}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-background/80 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors cursor-pointer flex items-center justify-center gap-1"
              onClick={() => addAnnotation(type)}
            >
              <Plus className="w-3 h-3" />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Annotation list */}
        {settings.annotations.map((a, i) => (
          <div
            key={a.id}
            className="p-2.5 rounded-lg bg-background/60 border border-border/30 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                {a.type} #{i + 1}
              </span>
              <button
                className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                onClick={() => deleteAnnotation(a.id)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <Input
              value={a.text}
              onChange={(e) => updateAnnotation(a.id, { text: e.target.value })}
              placeholder="Text..."
              className="h-6 text-xs"
            />

            <div className="grid grid-cols-2 gap-2">
              <SliderRow
                label="X"
                value={a.x}
                onChange={(v) => updateAnnotation(a.id, { x: v })}
                min={0}
                max={100}
                step={1}
                unit="%"
              />
              <SliderRow
                label="Y"
                value={a.y}
                onChange={(v) => updateAnnotation(a.id, { y: v })}
                min={0}
                max={100}
                step={1}
                unit="%"
              />
            </div>

            {a.type === 'arrow' && (
              <div className="grid grid-cols-2 gap-2">
                <SliderRow
                  label="To X"
                  value={a.toX ?? 70}
                  onChange={(v) => updateAnnotation(a.id, { toX: v })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                />
                <SliderRow
                  label="To Y"
                  value={a.toY ?? 70}
                  onChange={(v) => updateAnnotation(a.id, { toY: v })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                />
              </div>
            )}

            <SliderRow
              label="Size"
              value={a.fontSize}
              onChange={(v) => updateAnnotation(a.id, { fontSize: v })}
              min={8}
              max={32}
              step={1}
              unit="px"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Color</span>
              <label
                className="relative w-5 h-5 rounded-full border border-border/50 cursor-pointer shrink-0"
                style={{ backgroundColor: a.color }}
              >
                <input
                  type="color"
                  value={a.color}
                  onChange={(e) => updateAnnotation(a.id, { color: e.target.value })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
              <span className="text-[10px] font-mono text-muted-foreground/50">{a.color}</span>
            </div>
          </div>
        ))}

        {settings.annotations.length === 0 && (
          <div className="text-[10px] text-muted-foreground/50 italic text-center py-2">
            No annotations yet
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};
