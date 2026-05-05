import React, { memo, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmojiGroup {
  name: string;
  emojis: string[];
}

const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: 'Documents',
    emojis: [
      '📄',
      '📝',
      '📋',
      '📑',
      '🗒️',
      '🗂️',
      '📚',
      '📖',
      '📕',
      '📗',
      '📘',
      '📙',
      '🔖',
      '🏷️',
      '📰',
      '📓',
      '📔',
      '📒',
      '📃',
      '📜',
      '🧾',
      '📇',
      '📈',
      '📉',
    ],
  },
  {
    name: 'Faces',
    emojis: [
      '😀',
      '😄',
      '😁',
      '😆',
      '😊',
      '🙂',
      '😉',
      '😍',
      '🤩',
      '😎',
      '🤓',
      '🧐',
      '🤔',
      '🤯',
      '😴',
      '🥳',
      '🤗',
      '😌',
      '😇',
      '🥸',
      '🤠',
      '🫡',
      '🤝',
      '👍',
    ],
  },
  {
    name: 'Symbols',
    emojis: [
      '✨',
      '⭐',
      '🌟',
      '💫',
      '⚡',
      '🔥',
      '💡',
      '🎯',
      '🧩',
      '🔮',
      '🪐',
      '🌙',
      '☀️',
      '🌈',
      '❄️',
      '💎',
      '🎴',
      '🧭',
      '🗝️',
      '🕯️',
      '✅',
      '❌',
      '➕',
      '➖',
    ],
  },
  {
    name: 'Nature',
    emojis: [
      '🌿',
      '🍃',
      '🌱',
      '🌳',
      '🌲',
      '🌴',
      '🌵',
      '🌷',
      '🌸',
      '🌹',
      '🌺',
      '🌻',
      '🌼',
      '🪷',
      '🪴',
      '🍀',
      '🌾',
      '🪶',
      '🐚',
      '🪸',
      '⛰️',
      '🌊',
      '🌍',
      '🌋',
    ],
  },
  {
    name: 'Objects',
    emojis: [
      '🖋️',
      '✏️',
      '🖊️',
      '🖌️',
      '🎨',
      '📐',
      '📏',
      '✂️',
      '📎',
      '📌',
      '🔗',
      '🔒',
      '🔑',
      '⚙️',
      '🛠️',
      '🧪',
      '🔬',
      '🔭',
      '🎲',
      '🧠',
      '💻',
      '⌨️',
      '🖥️',
      '📱',
    ],
  },
  {
    name: 'Activities',
    emojis: [
      '🚀',
      '✈️',
      '🛸',
      '⛵',
      '🏔️',
      '🗺️',
      '🧗',
      '🏃',
      '🎵',
      '🎬',
      '🎮',
      '🎭',
      '🏆',
      '🥇',
      '🎓',
      '🎁',
      '🎉',
      '🪄',
      '🧘',
      '☕',
      '🏓',
      '⚽',
      '🏀',
      '🚴',
    ],
  },
  {
    name: 'Food',
    emojis: [
      '🍎',
      '🍊',
      '🍋',
      '🍉',
      '🍇',
      '🍓',
      '🍒',
      '🍑',
      '🥑',
      '🥕',
      '🌽',
      '🍄',
      '🍞',
      '🧀',
      '🥐',
      '🍜',
      '🍣',
      '🍕',
      '🍔',
      '🌮',
      '🍪',
      '🍩',
      '🍰',
      '🍵',
    ],
  },
  {
    name: 'Travel',
    emojis: [
      '🚗',
      '🚕',
      '🚌',
      '🚎',
      '🚓',
      '🚑',
      '🚒',
      '🚲',
      '🏍️',
      '🚂',
      '🚆',
      '🚇',
      '🛫',
      '🛬',
      '🚢',
      '🧳',
      '🗽',
      '🗼',
      '🎡',
      '🎢',
      '🏝️',
      '🏜️',
      '🧭',
      '🧱',
    ],
  },
  {
    name: 'Animals',
    emojis: [
      '🐱',
      '🐶',
      '🦊',
      '🐼',
      '🐨',
      '🦁',
      '🐯',
      '🦄',
      '🦋',
      '🐝',
      '🐞',
      '🦉',
      '🦅',
      '🐢',
      '🐙',
      '🐳',
      '🦈',
      '🦒',
      '🦔',
      '🦦',
      '🐸',
      '🐧',
      '🦜',
      '🦭',
    ],
  },
];

const ALL_EMOJIS = EMOJI_GROUPS.flatMap((g) => g.emojis);

interface EmojiPickerProps {
  selected?: string;
  onSelect: (emoji: string) => void;
  onRandom?: () => void;
  onReset?: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = memo(
  ({ selected, onSelect, onRandom, onReset }) => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
      const q = query.trim();
      if (!q) return null;
      return ALL_EMOJIS.filter((e) => e.includes(q));
    }, [query]);

    return (
      <div className="w-72 max-h-80 flex flex-col">
        <div className="flex gap-2 p-2 border-b border-border/40">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji…"
            className="h-8 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered ? (
            <EmojiGrid emojis={filtered} selected={selected} onSelect={onSelect} />
          ) : (
            EMOJI_GROUPS.map((group) => (
              <div key={group.name} className="mb-3 last:mb-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-1 mb-1">
                  {group.name}
                </div>
                <EmojiGrid emojis={group.emojis} selected={selected} onSelect={onSelect} />
              </div>
            ))
          )}
          {filtered && filtered.length === 0 && (
            <div className="text-xs text-muted-foreground/60 text-center py-6">No matches</div>
          )}
        </div>

        {(onRandom || onReset) && (
          <div className="flex gap-1 p-2 border-t border-border/40">
            {onRandom && (
              <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onRandom}>
                Random
              </Button>
            )}
            {onReset && (
              <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onReset}>
                Reset
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmojiPicker.displayName = 'EmojiPicker';

interface EmojiGridProps {
  emojis: string[];
  selected?: string;
  onSelect: (emoji: string) => void;
}

const EmojiGrid: React.FC<EmojiGridProps> = ({ emojis, selected, onSelect }) => {
  return (
    <div className="grid grid-cols-7 gap-0.5">
      {emojis.map((emoji, i) => (
        <button
          key={`${emoji}-${i}`}
          type="button"
          onClick={() => onSelect(emoji)}
          className={cn(
            'h-8 w-8 inline-flex items-center justify-center rounded text-lg leading-none',
            'hover:bg-muted transition-colors',
            selected === emoji && 'bg-muted ring-1 ring-primary/40'
          )}
          aria-label={`Select ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;
