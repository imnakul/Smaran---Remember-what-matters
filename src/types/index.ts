/**
 * Single source of truth for the palette ids. Kept as a runtime array so values
 * arriving from outside the app (a Notion row a user hand-edited) can be checked
 * rather than trusted.
 */
export const THEME_IDS = [
  'sage',
  'dustyBlue',
  'terracotta',
  'lavender',
  'mutedYellow',
  'rose',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export interface ColorTheme {
  id: ThemeId;
  background: string;
  darkBackground: string;
  accent: string;
  shadow: string;
}

/**
 * Whole-app look presets. Unlike the colour themes these change structure --
 * density, radii, elevation, how a thought's colour is expressed -- so they are
 * validated the same way, as a runtime list rather than a bare union.
 */
export const APPEARANCE_IDS = ['soft', 'editorial', 'glass', 'compact', 'mono'] as const;

export type AppearanceId = (typeof APPEARANCE_IDS)[number];

export function isAppearanceId(value: unknown): value is AppearanceId {
  return typeof value === 'string' && (APPEARANCE_IDS as readonly string[]).includes(value);
}

export type CardLook = 'default' | 'neon' | 'dark';
export const CARD_BORDER_IDS = [
  'none',
  'left',
  'all',
  'dashed',
  'dotted',
  'neon',
  'rainbow',
  'vine',
] as const;
export type CardBorder = (typeof CARD_BORDER_IDS)[number];

export type CardCorner = 'sharp' | 'soft' | 'round' | 'pill';

export type TextSize = 'small' | 'medium' | 'large';

export const FONT_FAMILY_IDS = [
  'inter',
  'outfit',
  'lora',
  'jetbrains',
  'caveat',
  'jakarta',
  'grotesk',
] as const;
export type FontFamilyId = (typeof FONT_FAMILY_IDS)[number];

export function isFontFamilyId(value: string): value is FontFamilyId {
  return (FONT_FAMILY_IDS as readonly string[]).includes(value as FontFamilyId);
}

/**
 * Vertical breathing room inside a card.
 *
 * Kept separate from the appearance preset so the two compose: a look sets the
 * horizontal rhythm that defines it, and the user still decides how tall the
 * rows are.
 */
export type CardDensity = 'tight' | 'regular' | 'roomy';

/**
 * Multiplier applied to the look's own vertical padding and row height.
 *
 * A multiplier rather than fixed padding values, so density composes with the
 * appearance preset instead of flattening it: Compact stays tighter than Soft at
 * every setting, and each look keeps the proportions that make it recognisable.
 */
/** Vertical breathing room between cards, as a multiplier on the look's own gap. */
export type CardSpacing = 'tight' | 'regular' | 'roomy' | 'wide';

/**
 * A multiplier rather than an absolute gap, so `regular` reproduces each look's
 * own rhythm exactly and the control refines a preset instead of flattening the
 * five looks into one spacing.
 */
export const CARD_SPACING: Record<CardSpacing, { label: string; scale: number }> = {
  tight: { label: 'Tight', scale: 0.3 },
  regular: { label: 'Regular', scale: 1 },
  roomy: { label: 'Roomy', scale: 2 },
  wide: { label: 'Wide', scale: 3.2 },
};

/** How strongly a thought's colour is expressed in its card. */
export type ColorStrength = 'muted' | 'soft' | 'bold' | 'vivid';

/**
 * The palettes are pastel by design, which reads as washed out on a bright
 * screen. `mix` pulls the card fill towards the theme's own accent -- the
 * saturated version of the same hue -- so turning colour up deepens the note
 * rather than tinting it towards something else. `alpha` covers the translucent
 * looks, where dimness comes from what shows through rather than from the fill.
 */
export const CARD_COLOR_STRENGTH: Record<
  ColorStrength,
  { label: string; description: string; mix: number; alpha: number }
> = {
  muted: { label: 'Muted', description: 'Barely there. Colour as a hint.', mix: 0, alpha: 0.3 },
  soft: { label: 'Soft', description: 'The original pastel fill.', mix: 0.15, alpha: 0.55 },
  bold: { label: 'Bold', description: 'Clearly coloured at a glance.', mix: 0.45, alpha: 0.82 },
  vivid: { label: 'Vivid', description: 'Full strength. The colour leads.', mix: 0.75, alpha: 1 },
};

export const CARD_DENSITY: Record<CardDensity, { label: string; scale: number }> = {
  tight: { label: 'Tight', scale: 0.55 },
  regular: { label: 'Regular', scale: 1 },
  roomy: { label: 'Roomy', scale: 1.6 },
};

/** How heavily the scrim over a background image is weighted, for legibility. */
export type WallpaperDim = 'light' | 'medium' | 'strong';

export const WALLPAPER_DIM_OPACITY: Record<WallpaperDim, number> = {
  light: 0.25,
  medium: 0.5,
  strong: 0.75,
};

/** How long the app may sit in the background before the PIN gate re-arms. */
export type LockTimeout = 'immediate' | '1min' | '5min' | '15min';

export const LOCK_TIMEOUT_MS: Record<LockTimeout, number> = {
  immediate: 0,
  '1min': 60_000,
  '5min': 5 * 60_000,
  '15min': 15 * 60_000,
};

/**
 * Built-in life dimension collections for categorising thoughts and daily rhythms.
 */
export const COLLECTION_IDS = ['remember', 'learnings', 'blessings', 'sayings', 'tryDoing'] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

export function isCollectionId(value: unknown): value is CollectionId {
  return typeof value === 'string' && (COLLECTION_IDS as readonly string[]).includes(value as CollectionId);
}

export interface CollectionMeta {
  id: CollectionId;
  label: string;
  notionTitle: string;
  iconName: 'Brain' | 'BookOpen' | 'Sparkles' | 'Quote' | 'Zap';
  description: string;
}

export const COLLECTIONS: readonly CollectionMeta[] = [
  { id: 'remember', label: 'Remember', notionTitle: 'Remember', iconName: 'Brain', description: 'Core thoughts & reminders' },
  { id: 'learnings', label: 'Learnings', notionTitle: 'Learnings', iconName: 'BookOpen', description: 'Daily insights & wisdom' },
  { id: 'blessings', label: 'Blessings', notionTitle: 'Blessings', iconName: 'Sparkles', description: 'Gratitude & moments' },
  { id: 'sayings', label: 'Sayings', notionTitle: 'Sayings', iconName: 'Quote', description: 'Quotes & mantras' },
  { id: 'tryDoing', label: 'Try Doing', notionTitle: 'Try Doing', iconName: 'Zap', description: 'Experiments & habits' },
] as const;

export interface CollectionThemeConfig {
  appearance?: AppearanceId;
  fontFamily?: FontFamilyId;
  cardBorder?: CardBorder;
  cardCorner?: CardCorner;
  cardLook?: CardLook;
  cardDensity?: CardDensity;
  cardSpacing?: CardSpacing;
  colorStrength?: ColorStrength;
  generalThemeColor?: string;
  fontSizeScale?: number;
  customCornerRadius?: number;
  customCardPaddingY?: number;
  customCardDensity?: number;
}

export interface AppSettings {
  darkMode: boolean;
  /** Active collection tab shown in the main view */
  activeCollection: CollectionId;
  /** Custom order of collection tabs in navigation */
  collectionOrder?: CollectionId[];
  /** Per-collection theme and appearance overrides */
  collectionThemes?: Partial<Record<CollectionId, CollectionThemeConfig>>;
  /** Global primary theme / accent color for active tabs and chrome (e.g. #7A967A) */
  generalThemeColor: string;
  /** Whole-app look preset. Governs structure; the colour themes stay per-thought. */
  appearance: AppearanceId;
  /** Only consulted by the `soft` appearance -- the other presets define their own surface. */
  cardLook: CardLook;
  cardBorder: CardBorder;
  cardCorner: CardCorner;
  /** Custom corner radius in px, overriding discrete corner presets if set */
  customCornerRadius?: number;
  /** Vertical padding inside cards, applied on top of the appearance preset. */
  cardDensity: CardDensity;
  /** Custom card vertical padding in px, overriding discrete density presets if set */
  customCardPaddingY?: number;
  /** Custom density multiplier for spacing */
  customCardDensity?: number;
  /** Gap between cards, applied on top of the appearance preset. */
  cardSpacing: CardSpacing;
  /** How saturated a thought's colour appears in its card. */
  colorStrength: ColorStrength;
  reminderEnabled: boolean;
  /** 24-hour "HH:mm" local time */
  reminderTime: string;
  textSize: TextSize;
  /** Global font size scale multiplier (default: 1.0) */
  fontSizeScale: number;
  /** Typeface used across the whole app. */
  fontFamily: FontFamilyId;
  /** True once a PIN has been set. The PIN hash itself lives in SecureStore, never here. */
  pinEnabled: boolean;
  /**
   * Digit count of the configured PIN. Kept here so the keypad knows when the
   * entry is complete and can submit without a confirm button. Knowing the
   * length narrows the keyspace only trivially against an attacker who already
   * has to defeat the lockout.
   */
  pinLength: number;
  /** Grace period before backgrounding the app re-locks it. */
  lockTimeout: LockTimeout;
  /**
   * File URI of the background image, if one has been chosen. Always a copy in
   * the app's own storage -- a gallery `content://` URI is revoked on relaunch.
   */
  wallpaperUri?: string;
  /** Strength of the scrim laid over the background so text stays readable. */
  wallpaperDim: WallpaperDim;
  /**
   * Sets FLAG_SECURE, which blanks the app in the recents switcher. Android has
   * no per-app blur for this, and the same flag also blocks screenshots and
   * screen recording -- the two cannot be separated.
   */
  privacyScreen: boolean;
  /** True once a Notion token and database have been configured. */
  notionEnabled: boolean;
  /** Target Notion database id for Remember (legacy fallback). */
  notionDatabaseId?: string;
  /** Target Notion database ids mapped per collection. */
  notionDatabaseIds?: Partial<Record<CollectionId, string>>;
  /** ISO timestamp of the last fully successful sync, used for the status pill. */
  notionLastSyncedAt?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  activeCollection: 'remember',
  collectionOrder: ['remember', 'learnings', 'blessings', 'sayings', 'tryDoing'],
  collectionThemes: {},
  generalThemeColor: '#7A967A',
  appearance: 'soft',
  cardLook: 'default',
  cardBorder: 'none',
  cardCorner: 'round',
  cardDensity: 'regular',
  cardSpacing: 'regular',
  colorStrength: 'soft',
  reminderEnabled: false,
  reminderTime: '09:00',
  textSize: 'medium',
  fontSizeScale: 1.0,
  fontFamily: 'inter',
  pinEnabled: false,
  pinLength: 4,
  lockTimeout: 'immediate',
  wallpaperDim: 'medium',
  privacyScreen: false,
  notionEnabled: false,
  notionDatabaseIds: {},
};

export interface Thought {
  id: string;
  content: string;
  colorTheme: ThemeId;
  repeatIntervalDays: number;
  /** ISO string of the date the thought was created (used as the base for scheduling) */
  createdAt: string;
  /**
   * ISO timestamp of the last local mutation. Drives last-write-wins conflict
   * resolution against Notion — every write path must bump this.
   */
  updatedAt: string;
  /** Array of ISO strings (YYYY-MM-DD format) for dates it was completed */
  completionHistory: string[];
  /** When true, the thought is paused and excluded from scheduling until unarchived */
  archived?: boolean;
  /** Hex color (e.g. "#4A90D9") chosen via the custom color picker; overrides colorTheme's palette when set */
  customColor?: string;
  /**
   * Hides this thought's text behind a blur in the list until it is tapped.
   */
  spoiler?: boolean;
  /** Id of the mirrored Notion page. Absent until the thought has been pushed once. */
  notionPageId?: string;
  /** Life collection this thought belongs to. Defaults to 'remember' */
  collection?: CollectionId;
  /** Heading for Learnings or Blessings */
  heading?: string;
  /** Subheading or detailed notes for Learnings or Blessings */
  subheading?: string;
  /** Author or attribution for Sayings (e.g. "Marcus Aurelius") */
  author?: string;
  /** Specific date for Blessings or Learnings (ISO string or YYYY-MM-DD) */
  eventDate?: string;
}

/**
 * Record of a locally deleted thought. Kept so the deletion can be replayed to
 * Notion later — without these, a delete made offline would be resurrected by
 * the next pull.
 */
export interface Tombstone {
  id: string;
  /** ISO timestamp of the deletion. */
  deletedAt: string;
  /** Notion page to archive on the next successful push, if the thought was ever synced. */
  notionPageId?: string;
  /** Collection the thought belonged to. */
  collection?: CollectionId;
}

/** Coarse sync state surfaced in the header pill. */
export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

/**
 * The user-editable subset of a Thought. Identity, timestamps, completion history
 * and the Notion mapping are all owned by the storage layer, not the edit form.
 */
export type ThoughtDraft = Omit<
  Thought,
  'id' | 'createdAt' | 'updatedAt' | 'completionHistory' | 'notionPageId'
>;

