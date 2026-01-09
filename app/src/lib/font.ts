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
  | 'literata';

export interface FontOption {
  value: FontFamily;
  label: string;
  description: string;
  category: 'serif' | 'sans-serif';
}

export const fontOptions: FontOption[] = [
  {
    value: 'cascadia-code',
    label: 'Cascadia Code',
    description: 'A monospaced font with a modern look',
    category: 'sans-serif',
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
  },
  {
    value: 'open-sans',
    label: 'Open Sans',
    description: 'Friendly and accessible',
    category: 'sans-serif',
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
  },
  {
    value: 'source-serif-pro',
    label: 'Source Serif Pro',
    description: 'Balanced serif design',
    category: 'serif',
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
  },
  {
    value: 'nunito-sans',
    label: 'Nunito Sans',
    description: 'Rounded, friendly font excellent for long text',
    category: 'sans-serif',
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
  },
  {
    value: 'bitter',
    label: 'Bitter',
    description: 'Slab serif with excellent readability',
    category: 'serif',
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
];

export const fontCategories = {
  'sans-serif': fontOptions.filter((font) => font.category === 'sans-serif'),
  serif: fontOptions.filter((font) => font.category === 'serif'),
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
};
