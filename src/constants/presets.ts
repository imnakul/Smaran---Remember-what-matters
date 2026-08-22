import { AppSettings } from '../types';

/**
 * The settings a designer preset owns.
 *
 * Deliberately narrow: a preset sets how the app *looks* and nothing else. It
 * must never carry reminders, PIN state, Notion configuration or the wallpaper,
 * because trying a look should never be able to disarm a lock or drop a sync
 * target.
 */
export type PresetSettings = Pick<
  AppSettings,
  | 'appearance'
  | 'fontFamily'
  | 'cardCorner'
  | 'cardDensity'
  | 'darkMode'
  | 'cardLook'
  | 'cardBorder'
>;

export interface DesignPreset {
  id: string;
  label: string;
  /** One line shown under the label, describing the feel rather than the values. */
  description: string;
  settings: PresetSettings;
}

/**
 * Curated combinations of look, typeface and geometry.
 *
 * These exist because the individual controls below them compose into far more
 * combinations than are actually good: a serif at tight density in the Compact
 * look is reachable, but nobody wants it. A preset is one tap to a set of values
 * that were chosen together, and every control stays live afterwards so it is a
 * starting point rather than a mode.
 */
export const DESIGN_PRESETS: readonly DesignPreset[] = [
  {
    id: 'cream',
    label: 'Cream',
    description: 'The original. Soft colour-blocked cards on warm paper.',
    settings: {
      appearance: 'soft',
      fontFamily: 'inter',
      cardCorner: 'round',
      cardDensity: 'regular',
      darkMode: false,
      cardLook: 'default',
      cardBorder: 'none',
    },
  },
  {
    id: 'press',
    label: 'Press',
    description: 'Serif on paper, hairline rules, colour kept to the margin.',
    settings: {
      appearance: 'editorial',
      fontFamily: 'lora',
      cardCorner: 'sharp',
      cardDensity: 'roomy',
      darkMode: false,
      cardLook: 'default',
      cardBorder: 'none',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Translucent panels and rounded geometry, after dark.',
    settings: {
      appearance: 'glass',
      fontFamily: 'outfit',
      cardCorner: 'pill',
      cardDensity: 'regular',
      darkMode: true,
      cardLook: 'default',
      cardBorder: 'none',
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    description: 'Fixed-width ink on a dark grid. No colour, no shadow.',
    settings: {
      appearance: 'mono',
      fontFamily: 'jetbrains',
      cardCorner: 'sharp',
      cardDensity: 'tight',
      darkMode: true,
      cardLook: 'default',
      cardBorder: 'none',
    },
  },
  {
    id: 'pocket',
    label: 'Pocket',
    description: 'Dense list, colour as a dot. Fits the most on screen.',
    settings: {
      appearance: 'compact',
      fontFamily: 'inter',
      cardCorner: 'soft',
      cardDensity: 'tight',
      darkMode: false,
      cardLook: 'default',
      cardBorder: 'none',
    },
  },
  {
    id: 'studio',
    label: 'Studio',
    description: 'Glass and serif, given room to breathe.',
    settings: {
      appearance: 'glass',
      fontFamily: 'lora',
      cardCorner: 'round',
      cardDensity: 'roomy',
      darkMode: false,
      cardLook: 'default',
      cardBorder: 'none',
    },
  },
  {
    id: 'garden',
    label: 'Garden',
    description: 'Serif on warm paper, with a leaf sprig on every card.',
    settings: {
      appearance: 'soft',
      fontFamily: 'lora',
      cardCorner: 'round',
      cardDensity: 'roomy',
      darkMode: false,
      cardLook: 'default',
      cardBorder: 'vine',
    },
  },
  {
    id: 'grove',
    label: 'Grove',
    description: 'Accent bars down the margin, after dusk.',
    settings: {
      appearance: 'soft',
      fontFamily: 'outfit',
      cardCorner: 'soft',
      cardDensity: 'regular',
      darkMode: true,
      cardLook: 'default',
      cardBorder: 'left',
    },
  },
  {
    id: 'blossom',
    label: 'Blossom',
    description: 'Fully rounded and given plenty of air.',
    settings: {
      appearance: 'soft',
      fontFamily: 'outfit',
      cardCorner: 'pill',
      cardDensity: 'roomy',
      darkMode: false,
      cardLook: 'default',
      cardBorder: 'none',
    },
  },
  {
    id: 'prism',
    label: 'Prism',
    description: 'Dark glass with a full spectrum traced around every card.',
    settings: {
      appearance: 'glass',
      fontFamily: 'outfit',
      cardCorner: 'round',
      cardDensity: 'regular',
      darkMode: true,
      cardLook: 'default',
      cardBorder: 'rainbow',
    },
  },
];

/**
 * The preset the current settings match exactly, if any.
 *
 * Returns `null` once the user has adjusted anything, so the UI can show the
 * selection dropping away rather than claiming a preset that no longer describes
 * what is on screen.
 */
export function matchPreset(settings: AppSettings): DesignPreset | null {
  return (
    DESIGN_PRESETS.find(preset =>
      (Object.keys(preset.settings) as (keyof PresetSettings)[]).every(
        key => settings[key] === preset.settings[key]
      )
    ) ?? null
  );
}
