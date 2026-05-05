import { Palette, Sparkles } from 'lucide-react';
import React, { memo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  buildGradient,
  COVER_PALETTES,
  COVER_PATTERNS,
  type CoverPattern,
} from '@/utils/notion-cover';

import CoverPattern_ from './cover-pattern';

export interface CoverOverridePatch {
  paletteIndex?: number;
  patternIndex?: number;
  angle?: number;
  colors?: [string, string, string];
}

interface CoverPickerProps {
  current: {
    paletteIndex: number;
    patternIndex: number;
    angle: number;
    colors?: [string, string, string];
  };
  hasOverride: boolean;
  onChange: (patch: CoverOverridePatch) => void;
  onRandom?: () => void;
  onReset?: () => void;
}

const ANGLE_STEPS = [0, 45, 90, 135, 180, 225];

type Tab = 'presets' | 'custom';

const CoverPicker: React.FC<CoverPickerProps> = memo(
  ({ current, hasOverride, onChange, onRandom, onReset }) => {
    const [tab, setTab] = useState<Tab>(current.colors ? 'custom' : 'presets');

    const effectivePalette: [string, string, string] =
      current.colors ?? COVER_PALETTES[current.paletteIndex];

    return (
      <div className="w-72 max-h-[28rem] overflow-y-auto p-3 space-y-3">
        <TabSwitcher tab={tab} onChange={setTab} />

        {tab === 'presets' ? (
          <PresetsPanel
            paletteIndex={current.paletteIndex}
            angle={current.angle}
            onChange={onChange}
          />
        ) : (
          <CustomPanel colors={effectivePalette} onChange={onChange} />
        )}

        <Section title="Angle">
          <div className="grid grid-cols-6 gap-1">
            {ANGLE_STEPS.map((angle) => (
              <button
                key={angle}
                type="button"
                onClick={() => onChange({ angle })}
                className={cn(
                  'h-7 rounded text-[10px] font-medium tabular-nums',
                  'hover:bg-muted transition-colors',
                  current.angle === angle
                    ? 'bg-muted text-foreground ring-1 ring-primary/40'
                    : 'text-muted-foreground'
                )}
              >
                {angle}°
              </button>
            ))}
          </div>
        </Section>

        <Section title="Pattern">
          <div className="grid grid-cols-4 gap-1.5">
            {COVER_PATTERNS.map((pattern, idx) => (
              <PatternSwatch
                key={pattern}
                pattern={pattern}
                gradient={buildGradient(effectivePalette, current.angle)}
                selected={current.patternIndex === idx}
                onClick={() => onChange({ patternIndex: idx })}
              />
            ))}
          </div>
        </Section>

        <div className="flex gap-1 pt-1 border-t border-border/40">
          {onRandom && (
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onRandom}>
              Random
            </Button>
          )}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={onReset}
              disabled={!hasOverride}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    );
  }
);

CoverPicker.displayName = 'CoverPicker';

const TabSwitcher: React.FC<{ tab: Tab; onChange: (t: Tab) => void }> = ({ tab, onChange }) => (
  <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted/50 rounded-md">
    <TabButton active={tab === 'presets'} onClick={() => onChange('presets')}>
      <Sparkles className="h-3 w-3" />
      Presets
    </TabButton>
    <TabButton active={tab === 'custom'} onClick={() => onChange('custom')}>
      <Palette className="h-3 w-3" />
      Custom
    </TabButton>
  </div>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 h-7 rounded text-xs font-medium transition-colors',
      active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    )}
  >
    {children}
  </button>
);

const PresetsPanel: React.FC<{
  paletteIndex: number;
  angle: number;
  onChange: (patch: CoverOverridePatch) => void;
}> = ({ paletteIndex, angle, onChange }) => (
  <Section title="Gradient">
    <div className="grid grid-cols-4 gap-1.5">
      {COVER_PALETTES.map((palette, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onChange({ paletteIndex: idx, colors: undefined })}
          className={cn(
            'h-10 rounded-md ring-1 ring-border/40 transition-transform hover:scale-105',
            paletteIndex === idx && 'ring-2 ring-primary'
          )}
          style={{ background: buildGradient(palette, angle) }}
          aria-label={`Gradient ${idx + 1}`}
        />
      ))}
    </div>
  </Section>
);

const CustomPanel: React.FC<{
  colors: [string, string, string];
  onChange: (patch: CoverOverridePatch) => void;
}> = ({ colors, onChange }) => {
  const update = (i: 0 | 1 | 2, value: string) => {
    const next: [string, string, string] = [...colors];
    next[i] = value;
    onChange({ colors: next });
  };

  return (
    <Section title="Custom Colors">
      <div className="grid grid-cols-3 gap-2">
        {(['Start', 'Middle', 'End'] as const).map((label, i) => (
          <ColorStop
            key={label}
            label={label}
            value={colors[i]}
            onChange={(v) => update(i as 0 | 1 | 2, v)}
          />
        ))}
      </div>
    </Section>
  );
};

const ColorStop: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-muted-foreground/70">{label}</span>
    <label
      className="relative h-10 rounded-md cursor-pointer ring-1 ring-border/40 hover:ring-primary/40 transition-all overflow-hidden"
      style={{ background: value }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={`${label} color`}
      />
    </label>
    <span className="text-[9px] font-mono text-muted-foreground/60 truncate text-center">
      {value.toUpperCase()}
    </span>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-1.5">
      {title}
    </div>
    {children}
  </div>
);

interface PatternSwatchProps {
  pattern: CoverPattern;
  gradient: string;
  selected: boolean;
  onClick: () => void;
}

const PatternSwatch: React.FC<PatternSwatchProps> = ({ pattern, gradient, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative h-10 rounded-md overflow-hidden ring-1 ring-border/40 transition-transform hover:scale-105',
      selected && 'ring-2 ring-primary'
    )}
    style={{ background: gradient }}
    aria-label={`Pattern ${pattern}`}
  >
    <CoverPattern_ pattern={pattern} color="rgba(255,255,255,0.85)" opacity={0.35} />
  </button>
);

export default CoverPicker;
