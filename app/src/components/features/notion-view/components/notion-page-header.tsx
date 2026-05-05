import { ImageIcon } from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  COVER_PALETTES,
  COVER_PATTERNS,
  type CoverOverrides,
  generateCover,
} from '@/utils/notion-cover';

import CoverPicker from './cover-picker';
import NotionCover from './notion-cover';
import NotionIcon from './notion-icon';

interface NotionPageHeaderProps {
  title: string;
  seed: string;
  /** Override emoji icon. */
  customIcon?: string;
  /** Override cover gradient/pattern/angle. */
  customCover?: CoverOverrides;
  onIconChange?: (icon: string) => void;
  onIconReset?: () => void;
  onCoverChange?: (patch: CoverOverrides) => void;
  onCoverReset?: () => void;
  className?: string;
}

const ICON_RANDOM_SET = ['📄', '✨', '🌿', '🪷', '🔮', '💡', '🪐', '🎯', '🧩', '🌙', '🍃', '🪶'];

const NotionPageHeader: React.FC<NotionPageHeaderProps> = memo(
  ({
    title,
    seed,
    customIcon,
    customCover,
    onIconChange,
    onIconReset,
    onCoverChange,
    onCoverReset,
    className,
  }) => {
    const cover = useMemo(() => generateCover(seed, customCover), [seed, customCover]);
    const baseline = useMemo(() => generateCover(seed), [seed]);
    const icon = customIcon || cover.icon;

    const [coverPickerOpen, setCoverPickerOpen] = useState(false);

    // Resolve current effective indices for the picker UI. We re-derive them
    // from the chosen palette/pattern values rather than threading them through
    // generateCover, so the picker shows the right "selected" state whether the
    // user overrode them or not.
    const currentPaletteIndex =
      customCover?.paletteIndex ?? COVER_PALETTES.findIndex((p) => buildEqualsCover(p, cover));
    const currentPatternIndex = customCover?.patternIndex ?? COVER_PATTERNS.indexOf(cover.pattern);
    const currentAngle =
      customCover?.angle ?? extractAngle(cover.gradient) ?? extractAngle(baseline.gradient) ?? 0;

    const hasCoverOverride =
      !!customCover &&
      (customCover.paletteIndex !== undefined ||
        customCover.patternIndex !== undefined ||
        customCover.angle !== undefined ||
        customCover.colors !== undefined);

    const handleIconRandom = useCallback(() => {
      const next = ICON_RANDOM_SET[Math.floor(Math.random() * ICON_RANDOM_SET.length)];
      onIconChange?.(next);
    }, [onIconChange]);

    const handleCoverRandom = useCallback(() => {
      onCoverChange?.({
        paletteIndex: Math.floor(Math.random() * COVER_PALETTES.length),
        patternIndex: Math.floor(Math.random() * COVER_PATTERNS.length),
        angle: Math.floor(Math.random() * 18) * 10,
      });
    }, [onCoverChange]);

    const coverInteractive = !!onCoverChange;

    return (
      <header className={cn('relative mb-6', className)}>
        <div className="group relative">
          <NotionCover style={cover} />

          {coverInteractive && (
            <Popover open={coverPickerOpen} onOpenChange={setCoverPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Change cover"
                  className={cn(
                    'absolute top-2 right-2 z-10',
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
                    'bg-background/85 backdrop-blur-sm text-foreground text-xs font-medium',
                    'shadow-sm ring-1 ring-border/40',
                    'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity',
                    'hover:bg-background'
                  )}
                >
                  <ImageIcon className="h-3 w-3" />
                  Change cover
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" side="bottom" className="p-0 w-auto">
                <CoverPicker
                  current={{
                    paletteIndex: currentPaletteIndex < 0 ? 0 : currentPaletteIndex,
                    patternIndex: currentPatternIndex < 0 ? 0 : currentPatternIndex,
                    angle: currentAngle,
                    colors: customCover?.colors,
                  }}
                  hasOverride={hasCoverOverride}
                  onChange={(patch) => onCoverChange?.(patch)}
                  onRandom={handleCoverRandom}
                  onReset={
                    onCoverReset
                      ? () => {
                          onCoverReset();
                          setCoverPickerOpen(false);
                        }
                      : undefined
                  }
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="relative px-1 -mt-10 sm:-mt-12">
          <NotionIcon
            icon={icon}
            onChange={onIconChange}
            onReset={customIcon && onIconReset ? onIconReset : undefined}
            onRandom={onIconChange ? handleIconRandom : undefined}
          />
          <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground break-words">
            {title || 'Untitled'}
          </h1>
        </div>
      </header>
    );
  }
);

NotionPageHeader.displayName = 'NotionPageHeader';

/** Extracts the leading degree value from a `linear-gradient(<deg>deg, ...)` string. */
function extractAngle(gradient: string): number | null {
  const m = gradient.match(/linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg/);
  return m ? Number(m[1]) : null;
}

/** Checks whether a palette appears verbatim in the given cover's gradient. */
function buildEqualsCover(palette: [string, string, string], cover: { gradient: string }): boolean {
  return palette.every((c) => cover.gradient.includes(c));
}

export default NotionPageHeader;
