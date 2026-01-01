/**
 * Converts a hex color to HSL components
 * @param hex - Hex color string (e.g., "#3b82f6")
 * @returns HSL components as [h, s, l]
 */
export function hexToHSL(hex: string): [number, number, number] {
  // Remove the # if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Find min and max RGB components
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness
  const l = (max + min) / 2;

  // Initial values for saturation and hue
  let h = 0;
  let s = 0;

  // Only calculate saturation and hue if not grayscale
  if (max !== min) {
    // Calculate saturation
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);

    // Calculate hue
    if (max === r) {
      h = (g - b) / (max - min) + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }

    h = h * 60; // Convert to degrees
  }

  // Return as [hue, saturation%, lightness%]
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Converts HSL components to a hex color string
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string (e.g., "#3b82f6")
 */
export function hslToHex(h: number, s: number, l: number): string {
  // Convert S and L to fractions
  s /= 100;
  l /= 100;

  // Handle edge case for lightness
  if (l === 0) return '#000000';
  if (l === 1) return '#ffffff';

  const c = (1 - Math.abs(2 * l - 1)) * s; // Chroma
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  // Convert to 0-255 range and then to hex
  const toHex = (c: number) => {
    const hex = Math.round((c + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates a harmonious palette of colors based on the primary theme color
 *
 * @param primaryColor - The primary theme color in hex format (e.g., "#3b82f6")
 * @param count - Number of colors to generate
 * @returns Array of hex color strings
 */
export function generateThemeColors(primaryColor: string, count: number): string[] {
  // If count is 1, just return the primary color
  if (count <= 1) return [primaryColor];

  // Convert primary color to HSL for easier manipulation
  const [hue, saturation, lightness] = hexToHSL(primaryColor);

  const colors: string[] = [primaryColor];

  // Strategies for generating harmonious colors
  const strategies = [
    // Analogous colors (similar hues)
    (i: number) => {
      const offset = (30 * (i % 2 === 0 ? i : -i)) / count;
      const newHue = (hue + offset + 360) % 360;
      const newSat = Math.min(saturation + 5, 100);
      const newLight = Math.max(Math.min(lightness + ((i % 3) - 1) * 10, 85), 25);
      return [newHue, newSat, newLight];
    },

    // Complementary colors (across the color wheel)
    (i: number) => {
      const ratio = i / count;
      const complementaryHue = (hue + 180) % 360;
      const newHue = hue + (complementaryHue - hue) * ratio;
      const newSat = saturation - (i % 2) * 10;
      const newLight = Math.max(lightness - 5 + (i % 3) * 10, 30);
      return [newHue, newSat, newLight];
    },

    // Monochromatic variations (same hue, different saturation/lightness)
    (i: number) => {
      const newHue = hue;
      const newSat = Math.max(saturation - 10 * (i % 3), 35);
      const newLight = Math.max(Math.min(lightness + 15 * ((i % 3) - 1), 80), 30);
      return [newHue, newSat, newLight];
    },
  ];

  // For each additional color needed:
  for (let i = 1; i < count; i++) {
    // Choose strategy based on position
    const strategyIndex = i % strategies.length;
    const strategy = strategies[strategyIndex];

    // Get new HSL values
    const [newHue, newSat, newLight] = strategy(i);

    // Convert to hex and add to our palette
    colors.push(hslToHex(newHue, newSat, newLight));
  }

  return colors;
}
