export const COLOR_GROUPS = [
  {
    label: 'Blues & Teals',
    colors: [
      { hex: '#8BBEE8', name: 'Powder Blue' },
      { hex: '#4A6FA5', name: 'Steel Blue' },
      { hex: '#B5C7ED', name: 'Periwinkle' },
      { hex: '#5BA4CF', name: 'Cerulean' },
      { hex: '#7393B3', name: 'Dusty Blue' },
      { hex: '#B0C4DE', name: 'Arctic Blue' },
      { hex: '#5F9EA0', name: 'Teal' },
      { hex: '#8FD8C5', name: 'Seafoam' },
    ],
  },
  {
    label: 'Greens',
    colors: [
      { hex: '#94B49F', name: 'Sage' },
      { hex: '#9ED2BE', name: 'Mint' },
      { hex: '#2D8A6F', name: 'Emerald' },
      { hex: '#708238', name: 'Olive' },
      { hex: '#2A7A4F', name: 'Pine' },
      { hex: '#8A9A5B', name: 'Moss' },
    ],
  },
  {
    label: 'Purples & Pinks',
    colors: [
      { hex: '#A689E1', name: 'Lavender' },
      { hex: '#C3A6E1', name: 'Mauve' },
      { hex: '#9D7FBD', name: 'Amethyst' },
      { hex: '#C8A2C8', name: 'Lilac' },
      { hex: '#8E4585', name: 'Plum' },
      { hex: '#D4A5A5', name: 'Dusty Rose' },
      { hex: '#B29FD7', name: 'Orchid' },
    ],
  },
  {
    label: 'Warm & Browns',
    colors: [
      { hex: '#E8DACB', name: 'Sand' },
      { hex: '#B8A99A', name: 'Taupe' },
      { hex: '#D3A18C', name: 'Terracotta' },
      { hex: '#C19A6B', name: 'Camel' },
      { hex: '#8D6E63', name: 'Hickory' },
      { hex: '#BE7F51', name: 'Cinnamon' },
      { hex: '#6F4E37', name: 'Mocha' },
    ],
  },
  {
    label: 'Accents',
    colors: [
      { hex: '#F0A287', name: 'Coral' },
      { hex: '#DFBC7A', name: 'Amber' },
      { hex: '#FFDAB9', name: 'Peach' },
      { hex: '#FBCEB1', name: 'Apricot' },
      { hex: '#D4B95E', name: 'Mustard' },
      { hex: '#B7410E', name: 'Rust' },
    ],
  },
  {
    label: 'Neutrals',
    colors: [
      { hex: '#36404A', name: 'Charcoal' },
      { hex: '#64748B', name: 'Slate' },
      { hex: '#E6E6E6', name: 'Pearl' },
      { hex: '#474B4E', name: 'Graphite' },
      { hex: '#C0C5C1', name: 'Silver Sage' },
      { hex: '#848884', name: 'Smoke' },
    ],
  },
] as const;

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

export const TITLE_POSITIONS = [
  { value: 'left' as const, label: 'Left' },
  { value: 'center' as const, label: 'Center' },
  { value: 'right' as const, label: 'Right' },
];

export const WINDOW_ACCENT_PRESETS = [
  { name: 'Windows Blue', color: '#0078d4' },
  { name: 'Orchid', color: '#8764b8' },
  { name: 'Sea Green', color: '#00b294' },
  { name: 'Turf Green', color: '#498205' },
  { name: 'Camouflage', color: '#7e735f' },
  { name: 'Sunset', color: '#e74856' },
  { name: 'Storm', color: '#68768a' },
  { name: 'Iris', color: '#7160e8' },
] as const;

export const HIGHLIGHT_COLOR_PRESETS = [
  { label: 'Yellow', value: 'rgba(255,255,100,0.15)' },
  { label: 'Green', value: 'rgba(100,255,100,0.15)' },
  { label: 'Blue', value: 'rgba(100,150,255,0.2)' },
  { label: 'Red', value: 'rgba(255,100,100,0.15)' },
  { label: 'Purple', value: 'rgba(180,100,255,0.15)' },
  { label: 'Orange', value: 'rgba(255,180,50,0.15)' },
];

export const BORDER_STYLES = [
  { value: 'solid' as const, label: 'Solid' },
  { value: 'double' as const, label: 'Double' },
  { value: 'groove' as const, label: 'Groove' },
  { value: 'ridge' as const, label: 'Ridge' },
];

export const CAPTION_POSITIONS = [
  { value: 'below' as const, label: 'Below' },
  { value: 'overlay-bottom' as const, label: 'Bottom' },
  { value: 'overlay-top' as const, label: 'Top' },
];

export const CAPTION_FONT_FAMILIES = [
  'system-ui, sans-serif',
  'Georgia, serif',
  'Palatino Linotype, serif',
  'Garamond, serif',
  'Inter, sans-serif',
  'Helvetica Neue, sans-serif',
  'Avenir, sans-serif',
  'Futura, sans-serif',
  'Source Code Pro, monospace',
  'Playfair Display, serif',
];

export const CAPTION_FONT_WEIGHTS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'normal' as const, label: 'Regular' },
  { value: 'bold' as const, label: 'Bold' },
];

export const CAPTION_ALIGNMENTS = [
  { value: 'left' as const, label: 'Left' },
  { value: 'center' as const, label: 'Center' },
  { value: 'right' as const, label: 'Right' },
];

export const BACKGROUND_PATTERNS = [
  { value: 'dots' as const, label: 'Dots' },
  { value: 'polka' as const, label: 'Polka' },
  { value: 'grid' as const, label: 'Grid' },
  { value: 'diagonal' as const, label: 'Diagonal' },
  { value: 'cross-hatch' as const, label: 'Cross Hatch' },
  { value: 'hexagons' as const, label: 'Hexagons' },
  { value: 'waves' as const, label: 'Waves' },
  { value: 'checkerboard' as const, label: 'Checkerboard' },
  { value: 'circles' as const, label: 'Circles' },
  { value: 'noise' as const, label: 'Noise' },
];

export const TINT_COLOR_PRESETS = [
  { label: 'Warm', value: '#ff8800' },
  { label: 'Cool', value: '#0088ff' },
  { label: 'Rose', value: '#ff4488' },
  { label: 'Green', value: '#00cc66' },
  { label: 'Purple', value: '#8844ff' },
  { label: 'Gold', value: '#ffcc00' },
];

export const FILTER_PRESETS = [
  {
    name: 'Vintage',
    values: {
      brightness: 110,
      contrast: 85,
      saturation: 70,
      sepia: 30,
      hueRotate: 0,
      grayscale: 0,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: 'Dramatic B&W',
    values: {
      brightness: 105,
      contrast: 130,
      saturation: 0,
      sepia: 0,
      hueRotate: 0,
      grayscale: 100,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: 'Warm Glow',
    values: {
      brightness: 108,
      contrast: 105,
      saturation: 120,
      sepia: 15,
      hueRotate: 0,
      grayscale: 0,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: 'Cool Tone',
    values: {
      brightness: 100,
      contrast: 105,
      saturation: 90,
      sepia: 0,
      hueRotate: 200,
      grayscale: 0,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: 'Faded',
    values: {
      brightness: 115,
      contrast: 80,
      saturation: 60,
      sepia: 10,
      hueRotate: 0,
      grayscale: 0,
      blur: 0,
      invert: 0,
    },
  },
  {
    name: 'Vivid',
    values: {
      brightness: 105,
      contrast: 115,
      saturation: 150,
      sepia: 0,
      hueRotate: 0,
      grayscale: 0,
      blur: 0,
      invert: 0,
    },
  },
] as const;
