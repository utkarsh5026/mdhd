export const GRADIENT_PRESETS = [
  { name: 'Sunset', from: '#F0A287', to: '#A689E1', angle: 135 },
  { name: 'Ocean', from: '#5BA4CF', to: '#2D8A6F', angle: 135 },
  { name: 'Midnight', from: '#36404A', to: '#4A6FA5', angle: 135 },
  { name: 'Rose', from: '#D4A5A5', to: '#C3A6E1', angle: 135 },
  { name: 'Forest', from: '#2A7A4F', to: '#708238', angle: 45 },
  { name: 'Amber', from: '#DFBC7A', to: '#BE7F51', angle: 135 },
  { name: 'Arctic', from: '#B0C4DE', to: '#8FD8C5', angle: 135 },
  { name: 'Plum', from: '#8E4585', to: '#4A6FA5', angle: 135 },
] as const;

export const WINDOW_STYLES = [
  { value: 'macos' as const, label: 'macOS' },
  { value: 'windows' as const, label: 'Windows' },
  { value: 'none' as const, label: 'None' },
];

export const IMAGE_FIT_OPTIONS = [
  { value: 'cover' as const, label: 'Cover' },
  { value: 'contain' as const, label: 'Contain' },
  { value: 'fill' as const, label: 'Stretch' },
  { value: 'tile' as const, label: 'Tile' },
];

export const FONT_FAMILIES = [
  'Source Code Pro',
  'Fira Code',
  'JetBrains Mono',
  'Cascadia Code',
  'IBM Plex Mono',
  'Roboto Mono',
  'Ubuntu Mono',
  'Inconsolata',
  'SF Mono',
  'Consolas',
  'Courier New',
];

export const ASPECT_RATIOS = [
  { value: 'auto' as const, label: 'Auto' },
  { value: '16:9' as const, label: '16:9' },
  { value: '4:3' as const, label: '4:3' },
  { value: '1:1' as const, label: '1:1' },
  { value: '9:16' as const, label: '9:16' },
];

export const WATERMARK_POSITIONS = [
  { value: 'bottom-right' as const, label: 'Bottom Right' },
  { value: 'bottom-left' as const, label: 'Bottom Left' },
  { value: 'top-right' as const, label: 'Top Right' },
  { value: 'top-left' as const, label: 'Top Left' },
];

export const HIGHLIGHT_COLOR_PRESETS = [
  { label: 'Yellow', value: 'rgba(255,255,100,0.15)' },
  { label: 'Green', value: 'rgba(100,255,100,0.15)' },
  { label: 'Blue', value: 'rgba(100,150,255,0.2)' },
  { label: 'Red', value: 'rgba(255,100,100,0.15)' },
  { label: 'Purple', value: 'rgba(180,100,255,0.15)' },
  { label: 'Orange', value: 'rgba(255,180,50,0.15)' },
];
