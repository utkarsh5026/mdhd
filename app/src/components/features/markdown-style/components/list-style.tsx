import { List } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { OrderedListMarker, UnorderedListMarker } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';

const UL_OPTIONS: { marker: UnorderedListMarker; label: string; preview: string }[] = [
  { marker: 'disc', label: 'Disc', preview: '•' },
  { marker: 'dash', label: 'Dash', preview: '–' },
  { marker: 'arrow', label: 'Arrow', preview: '→' },
  { marker: 'none', label: 'None', preview: '  ' },
];

const OL_OPTIONS: { marker: OrderedListMarker; label: string; preview: string }[] = [
  { marker: 'decimal', label: '1 2 3', preview: '1.' },
  { marker: 'roman', label: 'i ii iii', preview: 'i.' },
  { marker: 'alpha', label: 'a b c', preview: 'a.' },
];

const ListStyleSettings: React.FC = () => {
  const unorderedListMarker = useMarkdownStyleStore((s) => s.settings.unorderedListMarker);
  const orderedListMarker = useMarkdownStyleStore((s) => s.settings.orderedListMarker);
  const setUnorderedListMarker = useMarkdownStyleStore((s) => s.setUnorderedListMarker);
  const setOrderedListMarker = useMarkdownStyleStore((s) => s.setOrderedListMarker);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <List className="h-3.5 w-3.5" />
        List Markers
      </div>

      {/* Unordered */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground px-0.5 uppercase tracking-wide">
          Unordered
        </div>
        <div className="flex bg-muted/40 rounded-xl p-1 gap-0.5">
          {UL_OPTIONS.map(({ marker, label, preview }) => (
            <button
              key={marker}
              onClick={() => setUnorderedListMarker(marker)}
              title={label}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                unorderedListMarker === marker
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-sm font-bold text-primary/80 leading-none">{preview}</span>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ordered */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground px-0.5 uppercase tracking-wide">
          Ordered
        </div>
        <div className="flex bg-muted/40 rounded-xl p-1 gap-0.5">
          {OL_OPTIONS.map(({ marker, label, preview }) => (
            <button
              key={marker}
              onClick={() => setOrderedListMarker(marker)}
              title={label}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                orderedListMarker === marker
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-sm font-bold text-primary/80 leading-none">{preview}</span>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListStyleSettings;
