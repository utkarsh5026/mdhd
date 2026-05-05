export type CoverPattern =
  | 'dots'
  | 'grid'
  | 'waves'
  | 'stripes'
  | 'mesh'
  | 'circles'
  | 'plus'
  | 'triangles'
  | 'polka'
  | 'diagonal'
  | 'crosshatch'
  | 'hexagons'
  | 'checkerboard'
  | 'microgrid'
  | 'diamonds'
  | 'dash'
  | 'confetti'
  | 'steps';

export interface CoverStyle {
  gradient: string;
  pattern: CoverPattern;
  patternColor: string;
  patternOpacity: number;
  icon: string;
}

/** Optional per-document overrides. Any field left undefined falls back to the deterministic value derived from the seed. */
export interface CoverOverrides {
  paletteIndex?: number;
  patternIndex?: number;
  /** Angle in degrees for the linear gradient. */
  angle?: number;
  /** Custom three-stop gradient colors. Takes precedence over `paletteIndex` when set. */
  colors?: [string, string, string];
}

export const COVER_PALETTES: Array<[string, string, string]> = [
  ['#fb923c', '#f43f5e', '#a855f7'],
  ['#06b6d4', '#3b82f6', '#8b5cf6'],
  ['#10b981', '#06b6d4', '#3b82f6'],
  ['#f59e0b', '#ef4444', '#ec4899'],
  ['#8b5cf6', '#ec4899', '#f43f5e'],
  ['#0ea5e9', '#22d3ee', '#a3e635'],
  ['#1e293b', '#475569', '#64748b'],
  ['#a78bfa', '#f0abfc', '#fda4af'],
  ['#16a34a', '#65a30d', '#facc15'],
  ['#7c3aed', '#2563eb', '#0891b2'],
  ['#db2777', '#9333ea', '#4f46e5'],
  ['#0d9488', '#0891b2', '#6366f1'],
];

export const COVER_PATTERNS: CoverPattern[] = [
  'dots',
  'grid',
  'waves',
  'stripes',
  'mesh',
  'circles',
  'plus',
  'triangles',
  'polka',
  'diagonal',
  'crosshatch',
  'hexagons',
  'checkerboard',
  'microgrid',
  'diamonds',
  'dash',
  'confetti',
  'steps',
];

const ICONS = [
  '📄',
  '📝',
  '📚',
  '📖',
  '✨',
  '🌿',
  '🪷',
  '🔮',
  '🗒️',
  '💡',
  '🪐',
  '🍃',
  '🎴',
  '🧭',
  '🗂️',
  '🪶',
  '🕯️',
  '🌙',
  '🧩',
  '🎯',
];

const fnv1a = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const buildGradient = (palette: [string, string, string], angle: number): string => {
  const [a, b, c] = palette;
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} 50%, ${c} 100%)`;
};

export const generateCover = (seed: string, overrides?: CoverOverrides): CoverStyle => {
  const h = fnv1a(seed || 'mdhd');
  const paletteIndex = overrides?.paletteIndex ?? h % COVER_PALETTES.length;
  const patternIndex = overrides?.patternIndex ?? (h >>> 8) % COVER_PATTERNS.length;
  const angle = overrides?.angle ?? ((h >>> 16) % 18) * 10;

  const palette = overrides?.colors ?? COVER_PALETTES[paletteIndex % COVER_PALETTES.length];
  const pattern = COVER_PATTERNS[patternIndex % COVER_PATTERNS.length];

  return {
    gradient: buildGradient(palette, angle),
    pattern,
    patternColor: 'rgba(255, 255, 255, 0.7)',
    patternOpacity: 0.18,
    icon: ICONS[(h >>> 4) % ICONS.length],
  };
};
