import { ColorTheme } from '../types';

export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(color * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

/** Mixes `hex` toward `target` by `ratio` (0 = pure hex, 1 = pure target). */
function mix(hex: string, target: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(target);
  return rgbToHex(
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio
  );
}

/** Builds a full card palette from a single accent hex, matching the look of the preset themes. */
export function themeFromCustomColor(accent: string): ColorTheme {
  return {
    id: 'sage',
    background: mix(accent, '#FFFFFF', 0.85),
    darkBackground: mix(accent, '#141416', 0.8),
    accent,
    shadow: mix(accent, '#FFFFFF', 0.6) + '33',
  };
}

/** Returns the hue (0-360) of a hex color, for re-positioning the hue slider when editing. */
export function hexToHue(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

export function isValidHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value.trim());
}

export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

/**
 * Converts `#RRGGBB` to an `rgba()` string.
 *
 * Translucent looks need the palette colour at partial opacity over a blur.
 * React Native has no colour-mix, and stacking an opacity on the view would
 * fade the card's contents too, so the alpha has to live in the colour itself.
 */
/**
 * Blends two hex colours, `t` of the way from `a` to `b`.
 *
 * Interpolating in sRGB rather than a perceptual space is fine here: both ends
 * are the same hue from the same palette, so there is no muddy midpoint to
 * avoid.
 */
export function mixHex(a: string, b: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const parse = (hex: string): [number, number, number] => {
    const raw = normalizeHex(hex).slice(1);
    const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const channel = (from: number, to: number): string =>
    Math.round(from + (to - from) * clamped)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}

export function withAlpha(hex: string, alpha: number): string {
  const raw = normalizeHex(hex).slice(1);
  // Expand the #RGB shorthand so the byte slicing below is always valid.
  const normalized = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
