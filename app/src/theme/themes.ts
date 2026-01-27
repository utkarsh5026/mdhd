export type ThemeOption = {
  name: string;
  category: string;
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  border: string;
  cardBg: string;
  cardForeground: string;
  mutedForeground: string;
  accentForeground: string;
  popoverForeground: string;
  isDark: boolean;
};

export const defaultThemes: ThemeOption[] = [
  {
    name: 'GitHub Dark',
    category: 'Modern Dark',
    background: '#0d1117',
    foreground: '#f0f6fc',
    primary: '#58a6ff',
    primaryForeground: '#ffffff',
    secondary: '#21262d',
    secondaryForeground: '#f0f6fc',
    border: '#30363d',
    cardBg: '#161b22',
    cardForeground: '#f0f6fc',
    mutedForeground: '#8b949e',
    accentForeground: '#f0f6fc',
    popoverForeground: '#f0f6fc',
    isDark: true,
  },
  {
    name: 'GitHub Light',
    category: 'Modern Light',
    background: '#ffffff',
    foreground: '#24292f',
    primary: '#0969da',
    primaryForeground: '#ffffff',
    secondary: '#f6f8fa',
    secondaryForeground: '#24292f',
    border: '#d0d7de',
    cardBg: '#f6f8fa',
    cardForeground: '#24292f',
    mutedForeground: '#656d76',
    accentForeground: '#24292f',
    popoverForeground: '#24292f',
    isDark: false,
  },
  {
    name: 'Linear Dark',
    category: 'Modern Dark',
    background: '#0c0d0e',
    foreground: '#ffffff',
    primary: '#5e6ad2',
    primaryForeground: '#ffffff',
    secondary: '#1a1b1e',
    secondaryForeground: '#ffffff',
    border: '#2a2d31',
    cardBg: '#151618',
    cardForeground: '#ffffff',
    mutedForeground: '#9ca3af',
    accentForeground: '#ffffff',
    popoverForeground: '#ffffff',
    isDark: true,
  },
];

let extendedThemesCache: ThemeOption[] | null = null;
let loadingPromise: Promise<ThemeOption[]> | null = null;

/**
 * Lazy loads extended themes from JSON file
 * Returns cached themes if already loaded
 */
export async function loadExtendedThemes(): Promise<ThemeOption[]> {
  if (extendedThemesCache) {
    return extendedThemesCache;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = fetch('/themes.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load themes: ${response.statusText}`);
      }
      return response.json();
    })
    .then((themes: ThemeOption[]) => {
      extendedThemesCache = themes;
      loadingPromise = null;
      return themes;
    })
    .catch((error) => {
      console.error('Failed to load extended themes:', error);
      loadingPromise = null;
      return [];
    });

  return loadingPromise;
}

/**
 * Gets all themes - defaults + extended
 * For initial render, only defaults are available
 * For full list after loading, use loadAllThemes()
 */
export const themes = defaultThemes;

/**
 * Loads and returns all available themes
 * Call this when you need the complete theme list
 */
export async function loadAllThemes(): Promise<ThemeOption[]> {
  const extended = await loadExtendedThemes();
  return [...defaultThemes, ...extended];
}

/**
 * Checks if extended themes are loaded
 */
export function areExtendedThemesLoaded(): boolean {
  return extendedThemesCache !== null;
}

/**
 * Gets the current theme count (defaults + loaded extended)
 */
export function getThemeCount(): number {
  return defaultThemes.length + (extendedThemesCache?.length ?? 0);
}

export const themeCategories = [
  {
    name: 'Modern Dark',
    icon: '🌙',
    description: 'Contemporary dark themes with excellent readability',
  },
  {
    name: 'Modern Light',
    icon: '☀️',
    description: 'Clean, modern light themes for focused work',
  },
  {
    name: 'Developer',
    icon: '💻',
    description: 'Code editor inspired themes with perfect contrast',
  },
  {
    name: 'Minimal',
    icon: '⚪',
    description: 'Distraction-free themes for maximum focus',
  },
  {
    name: 'Focus',
    icon: '🎯',
    description: 'Specially designed for deep work and concentration',
  },
  {
    name: 'High Contrast',
    icon: '⚫',
    description: 'Maximum contrast for accessibility and clarity',
  },
  {
    name: 'Nature',
    icon: '🌿',
    description: 'Calming nature-inspired color palettes',
  },
  {
    name: 'Warm',
    icon: '🔥',
    description: 'Cozy, warm-toned themes for comfortable reading',
  },
  {
    name: 'Soft & Pastel',
    icon: '🌸',
    description: 'Gentle, easy-on-the-eyes color schemes',
  },
  {
    name: 'Creative',
    icon: '🎨',
    description: 'Bold and artistic themes for creative expression',
  },
] as const;

export type ThemeCategory = (typeof themeCategories)[number]['name'];
