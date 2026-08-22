import { CardCorner, ColorTheme, ThemeId } from '../types';
import { themeFromCustomColor } from '../lib/color';

export const CORNER_RADIUS: Record<CardCorner, number> = {
  sharp: 3,
  soft: 14,
  round: 24,
  pill: 32,
};

export const COLORS = {
  background: '#FDFDF9', // Soft off-white/cream
  text: '#2D2D2D',
  textMuted: '#8B8B8B',
  disabled: '#D3D3D3',
};

/** App-chrome palette (screen background, headers, modals) for light vs dark mode. */
export const NEUTRAL = {
  light: {
    background: '#FDFDF9',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textMuted: '#8B8B8B',
    border: 'rgba(0,0,0,0.08)',
    pillMuted: 'rgba(45,45,45,0.05)',
  },
  dark: {
    background: '#141416',
    surface: '#1F1F23',
    text: '#F1F1EF',
    textMuted: '#9A9A9E',
    border: 'rgba(255,255,255,0.1)',
    pillMuted: 'rgba(255,255,255,0.08)',
  },
};

export const THEMES: Record<ThemeId, ColorTheme> = {
  sage: {
    id: 'sage',
    background: '#EAEFE9',
    darkBackground: '#212B22',
    accent: '#7A967A',
    shadow: 'rgba(122, 150, 122, 0.2)', // low-opacity matching shadow
  },
  dustyBlue: {
    id: 'dustyBlue',
    background: '#EBF0F4',
    darkBackground: '#1E2933',
    accent: '#7A92A3',
    shadow: 'rgba(122, 146, 163, 0.2)',
  },
  terracotta: {
    id: 'terracotta',
    background: '#F5ECE8',
    darkBackground: '#2C211D',
    accent: '#C18370',
    shadow: 'rgba(193, 131, 112, 0.2)',
  },
  lavender: {
    id: 'lavender',
    background: '#F2EFF4',
    darkBackground: '#241F2A',
    accent: '#9E8BA8',
    shadow: 'rgba(158, 139, 168, 0.2)',
  },
  mutedYellow: {
    id: 'mutedYellow',
    background: '#F6F4EB',
    darkBackground: '#2A2717',
    accent: '#C9B674',
    shadow: 'rgba(201, 182, 116, 0.2)',
  },
  rose: {
    id: 'rose',
    background: '#F5EBEB',
    darkBackground: '#2A1F20',
    accent: '#C28B8B',
    shadow: 'rgba(194, 139, 139, 0.2)',
  },
};

/** Resolves the effective palette for a thought: a custom hex color overrides its preset colorTheme. */
export function resolveTheme(thought: { colorTheme?: ThemeId; customColor?: string }): ColorTheme {
  if (thought?.customColor) return themeFromCustomColor(thought.customColor);
  if (thought?.colorTheme && THEMES[thought.colorTheme]) return THEMES[thought.colorTheme];
  return THEMES.sage;
}

export function resolveCornerRadius(
  settings: { cardCorner?: CardCorner; customCornerRadius?: number },
  collectionTheme?: { cardCorner?: CardCorner; customCornerRadius?: number }
): number {
  if (collectionTheme?.customCornerRadius !== undefined) return collectionTheme.customCornerRadius;
  if (settings?.customCornerRadius !== undefined) return settings.customCornerRadius;
  const corner = collectionTheme?.cardCorner ?? settings?.cardCorner ?? 'round';
  return CORNER_RADIUS[corner] ?? 24;
}

export const APP_ACCENT_PALETTES = [
  { id: 'sage', label: 'Sage', color: '#7A967A' },
  { id: 'forest', label: 'Forest', color: '#4A7C59' },
  { id: 'ocean', label: 'Ocean', color: '#3B82F6' },
  { id: 'indigo', label: 'Indigo', color: '#6366F1' },
  { id: 'violet', label: 'Violet', color: '#8B5CF6' },
  { id: 'rose', label: 'Rose', color: '#E11D48' },
  { id: 'sunset', label: 'Sunset', color: '#F97316' },
  { id: 'amber', label: 'Amber', color: '#D97706' },
  { id: 'charcoal', label: 'Charcoal', color: '#374151' },
] as const;

