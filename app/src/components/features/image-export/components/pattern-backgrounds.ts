import type React from 'react';

import type { SharedExportSettings } from '../store/types';

type PatternType = SharedExportSettings['backgroundPattern'];

/**
 * Builds an inline-style object that renders a repeating SVG pattern
 * as a CSS background-image on a div. Each pattern is encoded as a data URI.
 */
export function buildPatternBackground(
  pattern: PatternType,
  color: string,
  opacity: number,
  scale: number
): React.CSSProperties {
  const encodedColor = encodeURIComponent(color);
  const alpha = opacity / 100;

  switch (pattern) {
    case 'dots': {
      const size = Math.round(20 * scale);
      const r = Math.max(1.5 * scale, 1);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${size / 2}' cy='${size / 2}' r='${r}' fill='${encodedColor}' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'polka': {
      // Staggered/offset dots — every other row is shifted by half the cell size
      const size = Math.round(20 * scale);
      const r = Math.max(1.8 * scale, 1);
      const half = size / 2;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${half / 2}' cy='${half / 2}' r='${r}' fill='${encodedColor}' opacity='${alpha}'/><circle cx='${half / 2 + half}' cy='${half / 2 + half}' r='${r}' fill='${encodedColor}' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'grid': {
      const size = Math.round(24 * scale);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><path d='M ${size} 0 L 0 0 0 ${size}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'diagonal': {
      const size = Math.round(10 * scale);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><path d='M 0 ${size} L ${size} 0 M ${-size / 4} ${size / 4} L ${size / 4} ${-size / 4} M ${(size * 3) / 4} ${size + size / 4} L ${size + size / 4} ${(size * 3) / 4}' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'cross-hatch': {
      const size = Math.round(10 * scale);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><path d='M 0 0 L ${size} ${size} M ${size} 0 L 0 ${size}' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'hexagons': {
      // Flat-top honeycomb hexagon grid
      const s = Math.round(16 * scale);
      const w = Math.round(s * Math.sqrt(3));
      const h = s * 2;
      const tileW = w;
      const tileH = Math.round(h * 0.75);
      // Hexagon centered at (w/2, h/2), flat-top
      const hex = (cx: number, cy: number) => {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          pts.push(`${cx + s * Math.cos(angle)},${cy + s * Math.sin(angle)}`);
        }
        return pts.join(' ');
      };
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tileW}' height='${tileH}'><polygon points='${hex(tileW / 2, tileH / 2)}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/><polygon points='${hex(0, 0)}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/><polygon points='${hex(tileW, 0)}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/><polygon points='${hex(0, tileH)}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/><polygon points='${hex(tileW, tileH)}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'waves': {
      // Horizontal sine wave lines
      const w = Math.round(40 * scale);
      const h = Math.round(16 * scale);
      const a = h * 0.35; // amplitude
      const mid = h / 2;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><path d='M 0 ${mid} Q ${w / 4} ${mid - a} ${w / 2} ${mid} Q ${(w * 3) / 4} ${mid + a} ${w} ${mid}' fill='none' stroke='${encodedColor}' stroke-width='0.8' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'checkerboard': {
      const size = Math.round(12 * scale);
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size * 2}' height='${size * 2}'><rect width='${size}' height='${size}' fill='${encodedColor}' opacity='${alpha}'/><rect x='${size}' y='${size}' width='${size}' height='${size}' fill='${encodedColor}' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'circles': {
      // Concentric ring outlines
      const size = Math.round(28 * scale);
      const cx = size / 2;
      const cy = size / 2;
      const r1 = size * 0.35;
      const r2 = size * 0.15;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='${cx}' cy='${cy}' r='${r1}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/><circle cx='${cx}' cy='${cy}' r='${r2}' fill='none' stroke='${encodedColor}' stroke-width='0.5' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
    case 'noise': {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${0.65 / scale}' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='${alpha}'/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: 'repeat',
      };
    }
  }
}
