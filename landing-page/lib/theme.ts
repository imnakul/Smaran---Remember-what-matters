/**
 * Design tokens mirrored from the Smaran mobile app.
 *
 * These are the same values the product ships (`src/constants/theme.ts`,
 * `src/constants/borders.ts`, `src/constants/fonts.ts`). They are duplicated
 * rather than imported because the app is a React Native workspace with its own
 * build pipeline; keeping the shapes and names identical is what makes a drift
 * between the two obvious during review.
 */

/** A selectable note colour. Mirrors `THEMES` in the app. */
export interface AccentOption {
  readonly id: string;
  readonly label: string;
  /** Stroke / fill colour for active chrome. */
  readonly accent: string;
  /** Card wash in light mode. */
  readonly wash: string;
  /** Card wash in dark mode. */
  readonly darkWash: string;
}

export const ACCENTS: readonly AccentOption[] = [
  { id: 'sage', label: 'Sage', accent: '#7A967A', wash: '#EAEFE9', darkWash: '#212B22' },
  { id: 'dustyBlue', label: 'Dusty Blue', accent: '#7A92A3', wash: '#EBF0F4', darkWash: '#1E2933' },
  { id: 'terracotta', label: 'Terracotta', accent: '#C18370', wash: '#F5ECE8', darkWash: '#2C211D' },
  { id: 'lavender', label: 'Lavender', accent: '#9E8BA8', wash: '#F2EFF4', darkWash: '#241F2A' },
  { id: 'mutedYellow', label: 'Muted Yellow', accent: '#C9B674', wash: '#F6F4EB', darkWash: '#2A2717' },
  { id: 'rose', label: 'Rose', accent: '#C28B8B', wash: '#F5EBEB', darkWash: '#2A1F20' },
] as const;

/** The app's default note colour, used wherever the site is not being themed live. */
export const DEFAULT_ACCENT: AccentOption = ACCENTS[0];

/** Corner presets. Mirrors `CORNER_RADIUS` in the app. */
export const CORNER_RADIUS = {
  sharp: 3,
  soft: 14,
  round: 24,
  pill: 32,
} as const;

export type CardCorner = keyof typeof CORNER_RADIUS;

export const CORNER_OPTIONS: readonly { readonly id: CardCorner; readonly label: string }[] = [
  { id: 'sharp', label: 'Sharp' },
  { id: 'soft', label: 'Soft' },
  { id: 'round', label: 'Round' },
  { id: 'pill', label: 'Pill' },
] as const;

/**
 * Edge treatments. A subset of the app's `BORDER_OPTIONS` -- the two painted
 * treatments (`vine`, and the SVG-traced spectrum) are represented here by the
 * CSS-expressible ones, since this is a preview rather than the editor.
 */
export type CardBorder = 'none' | 'left' | 'all' | 'dashed' | 'neon';

export const BORDER_OPTIONS: readonly { readonly id: CardBorder; readonly label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'left', label: 'Accent bar' },
  { id: 'all', label: 'Outline' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'neon', label: 'Neon' },
] as const;

/**
 * The faces offered in the live preview. The app ships seven; these four are
 * the ones this site loads, so the preview never promises a font it cannot
 * render.
 */
export type TypefaceId = 'jakarta' | 'lora' | 'grotesk' | 'caveat';

export interface TypefaceOption {
  readonly id: TypefaceId;
  readonly label: string;
  readonly description: string;
  /** Tailwind family utility, spelled out so the compiler can see it. */
  readonly className: string;
}

export const TYPEFACES: readonly TypefaceOption[] = [
  {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    description: 'Crisp contemporary sans with geometric clarity and warmth.',
    className: 'font-sans',
  },
  {
    id: 'lora',
    label: 'Lora',
    description: 'A serif with contrast. Reads like a printed page.',
    className: 'font-display',
  },
  {
    id: 'grotesk',
    label: 'Space Grotesk',
    description: 'Distinctive neo-grotesque display with mechanical flair.',
    className: 'font-grotesk',
  },
  {
    id: 'caveat',
    label: 'Caveat',
    description: 'Natural handwriting with fluid personality.',
    className: 'font-hand',
  },
] as const;

/** Chrome palette, mirroring `NEUTRAL` in the app. */
export const NEUTRAL = {
  light: {
    background: '#FDFDF9',
    surface: '#FFFFFF',
    text: '#2D2D2D',
    textMuted: '#8B8B8B',
    border: 'rgba(0,0,0,0.08)',
  },
  dark: {
    background: '#141416',
    surface: '#1F1F23',
    text: '#F1F1EF',
    textMuted: '#9A9A9E',
    border: 'rgba(255,255,255,0.1)',
  },
} as const;
