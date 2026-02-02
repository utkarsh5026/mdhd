import type { FontFamily } from './font';

const loadedFonts = new Set<FontFamily>();

const fontImports: Record<FontFamily, () => Promise<void>> = {
  'system-ui': async () => {},
  georgia: async () => {},
  'cascadia-code': async () => {},

  inter: async () => {
    await import('@fontsource-variable/inter');
  },
  'roboto-slab': async () => {
    await import('@fontsource-variable/roboto-slab');
  },
  'source-serif-pro': async () => {
    await import('@fontsource-variable/source-serif-4');
  },
  lora: async () => {
    await import('@fontsource-variable/lora');
  },
  'open-sans': async () => {
    await import('@fontsource-variable/open-sans');
  },
  'source-sans-pro': async () => {
    await import('@fontsource-variable/source-sans-3');
  },
  'nunito-sans': async () => {
    await import('@fontsource-variable/nunito-sans');
  },
  'eb-garamond': async () => {
    await import('@fontsource-variable/eb-garamond');
  },
  bitter: async () => {
    await import('@fontsource-variable/bitter');
  },

  // Non-variable fonts - load specific weights
  merriweather: async () => {
    await import('@fontsource/merriweather/400.css');
    await import('@fontsource/merriweather/700.css');
  },
  'libre-baskerville': async () => {
    await import('@fontsource/libre-baskerville/400.css');
    await import('@fontsource/libre-baskerville/700.css');
  },
  'pt-serif': async () => {
    await import('@fontsource/pt-serif/400.css');
    await import('@fontsource/pt-serif/700.css');
  },
  'crimson-text': async () => {
    await import('@fontsource/crimson-text/400.css');
    await import('@fontsource/crimson-text/600.css');
    await import('@fontsource/crimson-text/700.css');
  },
  spectral: async () => {
    await import('@fontsource/spectral/400.css');
    await import('@fontsource/spectral/500.css');
    await import('@fontsource/spectral/600.css');
    await import('@fontsource/spectral/700.css');
  },
  vollkorn: async () => {
    await import('@fontsource/vollkorn/400.css');
    await import('@fontsource/vollkorn/500.css');
    await import('@fontsource/vollkorn/600.css');
    await import('@fontsource/vollkorn/700.css');
  },
  literata: async () => {
    await import('@fontsource/literata/400.css');
    await import('@fontsource/literata/500.css');
    await import('@fontsource/literata/600.css');
    await import('@fontsource/literata/700.css');
  },
  'atkinson-hyperlegible': async () => {
    await import('@fontsource/atkinson-hyperlegible/400.css');
    await import('@fontsource/atkinson-hyperlegible/700.css');
  },
  'ibm-plex-sans': async () => {
    await import('@fontsource/ibm-plex-sans/400.css');
    await import('@fontsource/ibm-plex-sans/500.css');
    await import('@fontsource/ibm-plex-sans/600.css');
    await import('@fontsource/ibm-plex-sans/700.css');
  },
};

/**
 * Dynamically load a font family
 * @param fontFamily - The font to load
 * @returns Promise that resolves when font is loaded
 */
export async function loadFont(fontFamily: FontFamily): Promise<void> {
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  const importFn = fontImports[fontFamily];
  if (!importFn) return;
  try {
    await importFn();
    loadedFonts.add(fontFamily);
  } catch (error) {
    console.error(`Failed to load font: ${fontFamily}`, error);
    throw error;
  }
}

/**
 * Check if a font is already loaded
 * @param fontFamily - The font to check
 * @returns True if the font is loaded
 */
export function isFontLoaded(fontFamily: FontFamily): boolean {
  return loadedFonts.has(fontFamily);
}
