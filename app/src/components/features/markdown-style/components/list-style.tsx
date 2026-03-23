import { List } from 'lucide-react';
import React from 'react';

import type { OrderedListMarker, UnorderedListMarker } from '../store/markdown-style-store';
import { useMarkdownStyleStore } from '../store/markdown-style-store';
import { StyleOptionGroup, StyleSectionHeader } from './style-option-group';

const UL_OPTIONS: { value: UnorderedListMarker; label: string; preview: string }[] = [
  { value: 'disc', label: 'Disc', preview: '•' },
  { value: 'dash', label: 'Dash', preview: '–' },
  { value: 'arrow', label: 'Arrow', preview: '→' },
  { value: 'none', label: 'None', preview: '  ' },
];

const OL_OPTIONS: { value: OrderedListMarker; label: string; preview: string }[] = [
  { value: 'decimal', label: '1 2 3', preview: '1.' },
  { value: 'roman', label: 'i ii iii', preview: 'i.' },
  { value: 'alpha', label: 'a b c', preview: 'a.' },
];

const ListStyleSettings: React.FC = () => {
  const unorderedListMarker = useMarkdownStyleStore((s) => s.settings.unorderedListMarker);
  const orderedListMarker = useMarkdownStyleStore((s) => s.settings.orderedListMarker);
  const setUnorderedListMarker = useMarkdownStyleStore((s) => s.setUnorderedListMarker);
  const setOrderedListMarker = useMarkdownStyleStore((s) => s.setOrderedListMarker);

  return (
    <div className="space-y-4">
      <StyleSectionHeader icon={List} label="List Markers" />

      {/* Unordered */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground px-0.5 uppercase tracking-wide">
          Unordered
        </div>
        <StyleOptionGroup
          options={UL_OPTIONS}
          value={unorderedListMarker}
          onChange={setUnorderedListMarker}
          renderOption={({ label }) => {
            const preview = UL_OPTIONS.find((o) => o.label === label)!.preview;
            return (
              <div className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium">
                <span className="text-sm font-bold text-primary/80 leading-none">{preview}</span>
                <span className="text-[10px]">{label}</span>
              </div>
            );
          }}
        />
      </div>

      {/* Ordered */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground px-0.5 uppercase tracking-wide">
          Ordered
        </div>
        <StyleOptionGroup
          options={OL_OPTIONS}
          value={orderedListMarker}
          onChange={setOrderedListMarker}
          renderOption={({ label }) => {
            const preview = OL_OPTIONS.find((o) => o.label === label)!.preview;
            return (
              <div className="flex flex-col items-center gap-0.5 py-2 text-xs font-medium">
                <span className="text-sm font-bold text-primary/80 leading-none">{preview}</span>
                <span className="text-[10px]">{label}</span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default ListStyleSettings;
