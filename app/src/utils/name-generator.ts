/**
 * Generates Railway-style random names like `brave-otter`, `silver-canyon`.
 * Used to assign filenames to pasted content that has no natural title.
 */

const ADJECTIVES = [
  'brave',
  'calm',
  'clever',
  'cosmic',
  'curious',
  'dusty',
  'eager',
  'gentle',
  'golden',
  'happy',
  'hidden',
  'jolly',
  'lively',
  'lucky',
  'misty',
  'quiet',
  'silent',
  'silver',
  'sleepy',
  'swift',
  'vivid',
  'witty',
  'wandering',
  'amber',
  'bright',
  'crimson',
  'dewy',
  'frosty',
  'gleaming',
  'humble',
  'ancient',
  'autumn',
  'azure',
  'breezy',
  'bold',
  'candid',
  'cerulean',
  'chill',
  'cloudy',
  'cozy',
  'daring',
  'dawnlit',
  'dreamy',
  'electric',
  'evening',
  'feathered',
  'fresh',
  'glassy',
  'glowing',
  'grand',
  'green',
  'hazy',
  'icy',
  'kind',
  'lofty',
  'mellow',
  'midnight',
  'modern',
  'moonlit',
  'nimble',
  'noble',
  'opal',
  'patient',
  'playful',
  'plucky',
  'proud',
  'radiant',
  'rapid',
  'rare',
  'rosy',
  'rugged',
  'sandy',
  'serene',
  'shy',
  'skyward',
  'soft',
  'solar',
  'spring',
  'stellar',
  'steady',
  'sunny',
  'tidy',
  'tranquil',
  'twilight',
  'velvet',
  'warm',
  'wild',
];

const NOUNS = [
  'otter',
  'lighthouse',
  'harbor',
  'meadow',
  'river',
  'canyon',
  'comet',
  'ember',
  'falcon',
  'glacier',
  'lantern',
  'orchard',
  'pine',
  'raven',
  'summit',
  'thicket',
  'tundra',
  'valley',
  'willow',
  'beacon',
  'cove',
  'delta',
  'fjord',
  'grove',
  'haven',
  'isle',
  'koi',
  'lagoon',
  'moss',
  'reef',
  'aurora',
  'bay',
  'breeze',
  'brook',
  'butte',
  'cascade',
  'cedar',
  'cliff',
  'cloud',
  'coast',
  'coral',
  'crater',
  'creek',
  'dune',
  'dusk',
  'eclipse',
  'estuary',
  'fern',
  'firefly',
  'forest',
  'gale',
  'garden',
  'geyser',
  'hill',
  'horizon',
  'iceberg',
  'inlet',
  'isthmus',
  'jungle',
  'key',
  'leaf',
  'maple',
  'mesa',
  'monolith',
  'moon',
  'nebula',
  'oasis',
  'owl',
  'peak',
  'pebble',
  'prairie',
  'quarry',
  'rain',
  'ridge',
  'saffron',
  'sage',
  'sail',
  'sanctuary',
  'sea',
  'shadow',
  'shore',
  'sky',
  'spark',
  'spruce',
  'star',
  'stone',
  'stream',
  'sunrise',
  'sunset',
  'trail',
  'wave',
  'wind',
  'zephyr',
];

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** Returns a `${adjective}-${noun}` pair, e.g. `brave-otter`. */
export const generateRandomName = (): string => `${pick(ADJECTIVES)}-${pick(NOUNS)}`;

const MAX_SLUG_LENGTH = 60;

/**
 * Convert arbitrary heading text into a filename-safe slug:
 * lowercase, alphanumerics + dashes/underscores only, dash-collapsed, trimmed,
 * truncated to {@link MAX_SLUG_LENGTH}. Returns `null` if nothing usable remains.
 */
export function slugifyForFilename(text: string): string | null {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]+/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug.length > 0 ? slug : null;
}

/**
 * Pull the first H1 (preferred) or H2 from markdown content and return it
 * slugified. Falls back to `null` when no heading is present or the heading
 * sanitizes to an empty string.
 */
export function deriveNameFromMarkdown(content: string): string | null {
  const h1 = content.match(/^#[ \t]+(.+)$/m);
  if (h1) {
    const slug = slugifyForFilename(h1[1]);
    if (slug) return slug;
  }
  const h2 = content.match(/^##[ \t]+(.+)$/m);
  if (h2) {
    const slug = slugifyForFilename(h2[1]);
    if (slug) return slug;
  }
  return null;
}
