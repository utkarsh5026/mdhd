export type FontFamily =
  | 'system-ui'
  | 'inter'
  | 'georgia'
  | 'merriweather'
  | 'roboto-slab'
  | 'source-serif-pro'
  | 'libre-baskerville'
  | 'lora'
  | 'pt-serif'
  | 'open-sans'
  | 'cascadia-code'
  | 'atkinson-hyperlegible'
  | 'source-sans-pro'
  | 'nunito-sans'
  | 'ibm-plex-sans'
  | 'crimson-text'
  | 'spectral'
  | 'eb-garamond'
  | 'bitter'
  | 'vollkorn'
  | 'literata'
  | 'source-code-pro'
  | 'fira-code'
  | 'jetbrains-mono';

export interface FontOption {
  value: FontFamily;
  label: string;
  description: string;
  category: 'serif' | 'sans-serif' | 'monospace';
  isVariable?: boolean; // Indicates if this font has variable font support
  weightRange?: [number, number]; // Weight range for variable fonts, e.g., [100, 900]
}

export const fontOptions: FontOption[] = [
  {
    value: 'cascadia-code',
    label: 'Cascadia Code',
    description: 'A monospaced font with a modern look',
    category: 'monospace',
  },
  {
    value: 'system-ui',
    label: 'System UI',
    description: "Your device's default font",
    category: 'sans-serif',
  },
  {
    value: 'inter',
    label: 'Inter',
    description: 'Clean & modern sans-serif',
    category: 'sans-serif',
    isVariable: true,
    weightRange: [100, 900],
  },
  {
    value: 'open-sans',
    label: 'Open Sans',
    description: 'Friendly and accessible',
    category: 'sans-serif',
    isVariable: true,
    weightRange: [300, 800],
  },
  {
    value: 'georgia',
    label: 'Georgia',
    description: 'Classic serif with elegance',
    category: 'serif',
  },
  {
    value: 'merriweather',
    label: 'Merriweather',
    description: 'Readable serif for long text',
    category: 'serif',
  },
  {
    value: 'roboto-slab',
    label: 'Roboto Slab',
    description: 'Modern slab serif',
    category: 'serif',
    isVariable: true,
    weightRange: [100, 900],
  },
  {
    value: 'source-serif-pro',
    label: 'Source Serif Pro',
    description: 'Balanced serif design',
    category: 'serif',
    isVariable: true,
    weightRange: [200, 900],
  },
  {
    value: 'libre-baskerville',
    label: 'Libre Baskerville',
    description: 'Old-style serif',
    category: 'serif',
  },
  {
    value: 'lora',
    label: 'Lora',
    description: 'Contemporary serif',
    category: 'serif',
    isVariable: true,
    weightRange: [400, 700],
  },
  {
    value: 'pt-serif',
    label: 'PT Serif',
    description: 'Transitional serif',
    category: 'serif',
  },
  {
    value: 'atkinson-hyperlegible',
    label: 'Atkinson Hyperlegible',
    description: 'Designed for maximum readability and accessibility',
    category: 'sans-serif',
  },
  {
    value: 'source-sans-pro',
    label: 'Source Sans Pro',
    description: "Adobe's font optimized for UI and long reading",
    category: 'sans-serif',
    isVariable: true,
    weightRange: [200, 900],
  },
  {
    value: 'nunito-sans',
    label: 'Nunito Sans',
    description: 'Rounded, friendly font excellent for long text',
    category: 'sans-serif',
    isVariable: true,
    weightRange: [200, 1000],
  },
  {
    value: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    description: 'Corporate-grade font designed for extended reading',
    category: 'sans-serif',
  },
  {
    value: 'crimson-text',
    label: 'Crimson Text',
    description: 'Inspired by old-style book typography',
    category: 'serif',
  },
  {
    value: 'spectral',
    label: 'Spectral',
    description: "Google's font optimized for screen reading",
    category: 'serif',
  },
  {
    value: 'eb-garamond',
    label: 'EB Garamond',
    description: 'Classic Garamond revival, perfect for books',
    category: 'serif',
    isVariable: true,
    weightRange: [400, 800],
  },
  {
    value: 'bitter',
    label: 'Bitter',
    description: 'Slab serif with excellent readability',
    category: 'serif',
    isVariable: true,
    weightRange: [100, 900],
  },
  {
    value: 'vollkorn',
    label: 'Vollkorn',
    description: 'Designed specifically for bread text reading',
    category: 'serif',
  },
  {
    value: 'literata',
    label: 'Literata',
    description: "Google Play Books' reading font",
    category: 'serif',
  },
  {
    value: 'source-code-pro',
    label: 'Source Code Pro',
    description: "Adobe's monospaced font for coding",
    category: 'monospace',
    isVariable: true,
    weightRange: [200, 900],
  },
  {
    value: 'fira-code',
    label: 'Fira Code',
    description: 'Monospaced font with programming ligatures',
    category: 'monospace',
    isVariable: true,
    weightRange: [300, 700],
  },
  {
    value: 'jetbrains-mono',
    label: 'JetBrains Mono',
    description: 'Developer font with increased height for better readability',
    category: 'monospace',
    isVariable: true,
    weightRange: [100, 800],
  },
];

export const fontCategories = {
  'sans-serif': fontOptions.filter((font) => font.category === 'sans-serif'),
  serif: fontOptions.filter((font) => font.category === 'serif'),
  monospace: fontOptions.filter((font) => font.category === 'monospace'),
};

export const FONT_CSS_MAP: Record<FontFamily, React.CSSProperties> = {
  'cascadia-code': { fontFamily: '"Cascadia Code", monospace' },
  'system-ui': {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  inter: { fontFamily: '"Inter", sans-serif' },
  georgia: { fontFamily: 'Georgia, serif' },
  merriweather: { fontFamily: '"Merriweather", serif' },
  'roboto-slab': { fontFamily: '"Roboto Slab", serif' },
  'source-serif-pro': { fontFamily: '"Source Serif Pro", serif' },
  'libre-baskerville': { fontFamily: '"Libre Baskerville", serif' },
  lora: { fontFamily: '"Lora", serif' },
  'pt-serif': { fontFamily: '"PT Serif", serif' },
  'open-sans': { fontFamily: '"Open Sans", sans-serif' },
  'atkinson-hyperlegible': { fontFamily: '"Atkinson Hyperlegible", sans-serif' },
  'source-sans-pro': { fontFamily: '"Source Sans Pro", sans-serif' },
  'nunito-sans': { fontFamily: '"Nunito Sans", sans-serif' },
  'ibm-plex-sans': { fontFamily: '"IBM Plex Sans", sans-serif' },
  'crimson-text': { fontFamily: '"Crimson Text", serif' },
  spectral: { fontFamily: '"Spectral", serif' },
  'eb-garamond': { fontFamily: '"EB Garamond", serif' },
  bitter: { fontFamily: '"Bitter", serif' },
  vollkorn: { fontFamily: '"Vollkorn", serif' },
  literata: { fontFamily: '"Literata", serif' },
  'source-code-pro': { fontFamily: '"Source Code Pro", monospace' },
  'fira-code': { fontFamily: '"Fira Code", monospace' },
  'jetbrains-mono': { fontFamily: '"JetBrains Mono", monospace' },
};

export const getFontCss = (font: FontFamily): React.CSSProperties => {
  return FONT_CSS_MAP[font] ?? { fontFamily: 'inherit' };
};

export const fontFamilyMap: Record<FontFamily, string> = {
  'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", sans-serif',
  georgia: 'Georgia, serif',
  merriweather: '"Merriweather", serif',
  'roboto-slab': '"Roboto Slab", serif',
  'source-serif-pro': '"Source Serif Pro", serif',
  'libre-baskerville': '"Libre Baskerville", serif',
  lora: '"Lora", serif',
  'pt-serif': '"PT Serif", serif',
  'open-sans': '"Open Sans", sans-serif',
  'cascadia-code': '"Cascadia Code", monospace',
  'atkinson-hyperlegible': '"Atkinson Hyperlegible", sans-serif',
  'source-sans-pro': '"Source Sans Pro", sans-serif',
  'nunito-sans': '"Nunito Sans", sans-serif',
  'ibm-plex-sans': '"IBM Plex Sans", sans-serif',
  'crimson-text': '"Crimson Text", serif',
  spectral: '"Spectral", serif',
  'eb-garamond': '"EB Garamond", serif',
  bitter: '"Bitter", serif',
  vollkorn: '"Vollkorn", serif',
  literata: '"Literata", serif',
  'source-code-pro': '"Source Code Pro", monospace',
  'fira-code': '"Fira Code", monospace',
  'jetbrains-mono': '"JetBrains Mono", monospace',
};

// --- App UI Font ---

export type AppFontFamily = FontFamily | 'geist';

export interface AppFontOption {
  value: AppFontFamily;
  label: string;
  description: string;
  category: 'serif' | 'sans-serif' | 'monospace';
}

const geistOption: AppFontOption = {
  value: 'geist',
  label: 'Geist',
  description: 'Modern, clean sans-serif',
  category: 'sans-serif',
};

export const APP_FONT_OPTIONS: AppFontOption[] = [
  geistOption,
  ...fontOptions.map((f) => ({
    value: f.value,
    label: f.label,
    description: f.description,
    category: f.category,
  })),
];

export const APP_FONT_CSS_MAP: Record<AppFontFamily, string> = {
  geist: "'GeistVariable', 'Geist', sans-serif",
  ...fontFamilyMap,
};

export const appFontCategories = {
  'sans-serif': APP_FONT_OPTIONS.filter((font) => font.category === 'sans-serif'),
  serif: APP_FONT_OPTIONS.filter((font) => font.category === 'serif'),
  monospace: APP_FONT_OPTIONS.filter((font) => font.category === 'monospace'),
};
