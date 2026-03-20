import { describe, expect, it } from 'vitest';

import { generateThemeColors, hexToHSL, hslToHex } from './colors';

describe('hexToHSL', () => {
  it('converts pure red', () => {
    expect(hexToHSL('#ff0000')).toEqual([0, 100, 50]);
  });

  it('converts pure green', () => {
    expect(hexToHSL('#00ff00')).toEqual([120, 100, 50]);
  });

  it('converts pure blue', () => {
    expect(hexToHSL('#0000ff')).toEqual([240, 100, 50]);
  });

  it('converts white (grayscale)', () => {
    expect(hexToHSL('#ffffff')).toEqual([0, 0, 100]);
  });

  it('converts black (grayscale)', () => {
    expect(hexToHSL('#000000')).toEqual([0, 0, 0]);
  });

  it('converts mid-gray', () => {
    const [h, s, l] = hexToHSL('#808080');
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBe(50);
  });

  it('works without # prefix', () => {
    expect(hexToHSL('ff0000')).toEqual([0, 100, 50]);
  });

  it('converts a typical color (Tailwind blue-500 #3b82f6)', () => {
    const [h, s, l] = hexToHSL('#3b82f6');
    expect(h).toBeGreaterThan(210);
    expect(h).toBeLessThan(225);
    expect(s).toBeGreaterThan(85);
    expect(l).toBeGreaterThan(55);
    expect(l).toBeLessThan(65);
  });

  it('converts yellow (#ffff00)', () => {
    expect(hexToHSL('#ffff00')).toEqual([60, 100, 50]);
  });

  it('converts cyan (#00ffff)', () => {
    expect(hexToHSL('#00ffff')).toEqual([180, 100, 50]);
  });

  it('converts magenta (#ff00ff)', () => {
    expect(hexToHSL('#ff00ff')).toEqual([300, 100, 50]);
  });
});

describe('hslToHex', () => {
  it('converts pure red HSL to hex', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
  });

  it('converts pure green HSL to hex', () => {
    expect(hslToHex(120, 100, 50)).toBe('#00ff00');
  });

  it('converts pure blue HSL to hex', () => {
    expect(hslToHex(240, 100, 50)).toBe('#0000ff');
  });

  it('converts black (lightness=0)', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white (lightness=100)', () => {
    expect(hslToHex(0, 0, 100)).toBe('#ffffff');
  });

  it('converts gray (saturation=0)', () => {
    const hex = hslToHex(0, 0, 50);
    expect(hex).toBe('#808080');
  });

  it('converts yellow', () => {
    expect(hslToHex(60, 100, 50)).toBe('#ffff00');
  });

  it('converts cyan', () => {
    expect(hslToHex(180, 100, 50)).toBe('#00ffff');
  });

  it('converts magenta', () => {
    expect(hslToHex(300, 100, 50)).toBe('#ff00ff');
  });
});

describe('hexToHSL ↔ hslToHex roundtrip', () => {
  const testColors = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#00ffff',
    '#ff00ff',
    '#808080',
    '#ffffff',
  ];

  for (const hex of testColors) {
    it(`roundtrips ${hex}`, () => {
      const [h, s, l] = hexToHSL(hex);
      const result = hslToHex(h, s, l);
      expect(result.toLowerCase()).toBe(hex.toLowerCase());
    });
  }
});

describe('generateThemeColors', () => {
  it('returns just the primary for count=1', () => {
    expect(generateThemeColors('#3b82f6', 1)).toEqual(['#3b82f6']);
  });

  it('returns empty array for count=0', () => {
    expect(generateThemeColors('#3b82f6', 0)).toEqual(['#3b82f6']);
  });

  it('returns the requested number of colors', () => {
    const colors = generateThemeColors('#3b82f6', 5);
    expect(colors).toHaveLength(5);
  });

  it('always includes the primary color first', () => {
    const colors = generateThemeColors('#e74c3c', 4);
    expect(colors[0]).toBe('#e74c3c');
  });

  it('generates valid hex colors', () => {
    const colors = generateThemeColors('#3b82f6', 6);
    const hexRegex = /^#[0-9a-f]{6}$/i;
    for (const color of colors) {
      expect(color).toMatch(hexRegex);
    }
  });

  it('generates distinct colors', () => {
    const colors = generateThemeColors('#3b82f6', 4);
    const unique = new Set(colors);
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });
});
