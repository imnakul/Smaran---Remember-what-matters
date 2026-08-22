import {
  AppearanceId,
  CardCorner,
  CardDensity,
  CardSpacing,
  CARD_DENSITY,
  CARD_SPACING,
} from '../types';

/**
 * How a thought's palette colour is expressed on its card.
 *
 * This is the single biggest lever between the looks: the same six palettes can
 * read as a soft colour-blocked note, a hairline accent in the margin, a status
 * dot in a dense list, or nothing at all.
 */
export type ColorExpression = 'fill' | 'rule' | 'dot' | 'none';

export interface AppearanceTokens {
  id: AppearanceId;
  label: string;
  /** One line shown under the label in Settings. */
  description: string;

  /**
   * The look's own card radius in px, used as its default when the user has not
   * expressed a preference. `null` means the look has no opinion.
   */
  cardRadius: number | null;
  /** Radius for floating chrome: the header pill, the date pills, the FAB tray. */
  chromeRadius: number;
  /** Top-corner radius of the bottom sheets. */
  sheetRadius: number;

  /** Tailwind *horizontal* padding for the card body. Vertical padding is a token below. */
  cardPaddingX: string;
  /** Base vertical padding in px, before the user's density multiplier. */
  cardPaddingY: number;
  /** Tailwind *horizontal* margin from the screen edge. */
  cardGap: string;
  /** Base vertical gap between cards in px, before the user's spacing multiplier. */
  cardGapY: number;
  cardMinHeight: number;

  colorExpression: ColorExpression;
  /** Cards float on a blurred translucent wash rather than a solid fill. */
  translucent: boolean;

  /** Multiplier on the card's drop shadow. 0 removes it entirely. */
  elevation: number;
  /** Hairline drawn under each card instead of a shadow, for the flat looks. */
  divider: boolean;
  cardBorderWidth: number;

  /** Blur strength for chrome. 0 renders the chrome solid instead of frosted. */
  chromeBlur: number;

  /** Multiplier applied to the user's chosen text size. */
  textScale: number;
  /** The "repeats every N days" line, set in small caps. */
  metaUppercase: boolean;
  metaTracking: number;

  /** Ignore the per-thought colour entirely and render everything in ink. */
  monochrome: boolean;
}

/**
 * The five looks.
 *
 * `soft` is the app as it has always been and stays the default, so an existing
 * install sees no change until it opts in. The other four each commit to one
 * idea rather than nudging a few values: paper-and-rules, glass-and-light,
 * information density, and ink on white.
 */
export const APPEARANCES: Record<AppearanceId, AppearanceTokens> = {
  soft: {
    id: 'soft',
    label: 'Soft',
    description: 'Colour-blocked cards with a gentle shadow.',
    cardRadius: null,
    chromeRadius: 999,
    sheetRadius: 32,
    cardPaddingX: 'px-6',
    cardPaddingY: 24,
    cardGap: 'mx-4',
    cardGapY: 12,
    cardMinHeight: 96,
    colorExpression: 'fill',
    translucent: false,
    elevation: 1,
    divider: false,
    cardBorderWidth: 0,
    chromeBlur: 40,
    textScale: 1,
    metaUppercase: false,
    metaTracking: 0,
    monochrome: false,
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Paper, hairline rules, colour kept to the margin.',
    cardRadius: 4,
    chromeRadius: 10,
    sheetRadius: 12,
    cardPaddingX: 'pl-5 pr-6',
    cardPaddingY: 24,
    cardGap: 'mx-5',
    cardGapY: 4,
    cardMinHeight: 104,
    colorExpression: 'rule',
    translucent: false,
    elevation: 0,
    divider: true,
    cardBorderWidth: 0,
    chromeBlur: 0,
    textScale: 1.06,
    metaUppercase: true,
    metaTracking: 1.6,
    monochrome: false,
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    description: 'Translucent panels with light bleeding through.',
    cardRadius: 28,
    chromeRadius: 999,
    sheetRadius: 34,
    cardPaddingX: 'px-6',
    cardPaddingY: 24,
    cardGap: 'mx-4',
    cardGapY: 10,
    cardMinHeight: 104,
    colorExpression: 'fill',
    translucent: true,
    elevation: 0.5,
    divider: false,
    cardBorderWidth: 1,
    chromeBlur: 65,
    textScale: 1,
    metaUppercase: false,
    metaTracking: 0,
    monochrome: false,
  },
  compact: {
    id: 'compact',
    label: 'Compact',
    description: 'Dense list, colour reduced to a dot.',
    cardRadius: 12,
    chromeRadius: 18,
    sheetRadius: 20,
    cardPaddingX: 'px-4',
    cardPaddingY: 12,
    cardGap: 'mx-3',
    cardGapY: 4,
    cardMinHeight: 58,
    colorExpression: 'dot',
    translucent: false,
    elevation: 0.2,
    divider: false,
    cardBorderWidth: 1,
    chromeBlur: 30,
    textScale: 0.86,
    metaUppercase: false,
    metaTracking: 0,
    monochrome: false,
  },
  mono: {
    id: 'mono',
    label: 'Mono',
    description: 'Ink on paper. No colour anywhere.',
    cardRadius: 2,
    chromeRadius: 4,
    sheetRadius: 4,
    cardPaddingX: 'px-5',
    cardPaddingY: 20,
    cardGap: 'mx-4',
    cardGapY: 8,
    cardMinHeight: 92,
    colorExpression: 'none',
    translucent: false,
    elevation: 0,
    divider: false,
    cardBorderWidth: 1.5,
    chromeBlur: 0,
    textScale: 1,
    metaUppercase: true,
    metaTracking: 2,
    monochrome: true,
  },
};

/** Ordered for the Settings picker: default first, then most to least decorated. */
export const APPEARANCE_LIST: readonly AppearanceTokens[] = [
  APPEARANCES.soft,
  APPEARANCES.editorial,
  APPEARANCES.glass,
  APPEARANCES.compact,
  APPEARANCES.mono,
];

/**
 * The effective card radius.
 *
 * The user's own corner setting always wins. Earlier this deferred to the look
 * for every preset except the default, which meant the roundedness control
 * silently did nothing in four looks out of five -- a setting that appears to be
 * ignored is worse than one that is absent.
 */
export function resolveCardRadius(
  tokens: AppearanceTokens,
  corner: CardCorner,
  cornerRadius: Record<CardCorner, number>
): number {
  return cornerRadius[corner] ?? tokens.cardRadius ?? 0;
}

/** Vertical padding in px for a card, combining the look's rhythm with the user's density. */
export function resolveCardPaddingY(tokens: AppearanceTokens, density: CardDensity): number {
  return Math.round(tokens.cardPaddingY * CARD_DENSITY[density].scale);
}

/** Vertical margin around a card, combining the look's rhythm with the user's spacing. */
export function resolveCardGapY(tokens: AppearanceTokens, spacing: CardSpacing): number {
  return Math.round(tokens.cardGapY * CARD_SPACING[spacing].scale);
}

/** Minimum row height, scaled by the same density so short cards keep their proportions. */
export function resolveCardMinHeight(tokens: AppearanceTokens, density: CardDensity): number {
  return Math.round(tokens.cardMinHeight * CARD_DENSITY[density].scale);
}
