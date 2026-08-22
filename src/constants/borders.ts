import { CardBorder } from '../types';

export interface BorderOption {
  id: CardBorder;
  label: string;
  /** One line in Settings, describing the effect rather than the values. */
  description: string;
}

/**
 * Card edge treatments.
 *
 * Most of these are plain view borders, which keep the card a single native
 * view and stay perfectly in step with the corner radius. Only `rainbow` and
 * `vine` need to be drawn -- a gradient stroke and a botanical sprig cannot be
 * expressed as a border colour -- so those two are painted as an SVG overlay on
 * top of the card. See `CardEdgeArt`.
 */
export const BORDER_OPTIONS: readonly BorderOption[] = [
  { id: 'none', label: 'None', description: 'No edge. The card is defined by its fill alone.' },
  { id: 'left', label: 'Accent bar', description: 'A thick rule down the left edge, in the note colour.' },
  { id: 'all', label: 'Outline', description: 'A thin frame in the note colour.' },
  { id: 'dashed', label: 'Dashed', description: 'A stitched frame. Reads as a draft or a placeholder.' },
  { id: 'dotted', label: 'Dotted', description: 'A lighter, punched-out version of the frame.' },
  { id: 'neon', label: 'Neon', description: 'A lit edge with the colour bleeding out around it.' },
  { id: 'rainbow', label: 'Spectrum', description: 'A full-colour gradient traced around the card.' },
  { id: 'vine', label: 'Vine', description: 'Leaf sprigs growing from opposite corners.' },
];

/** The two treatments that are painted rather than set as a border style. */
export function isPaintedBorder(border: CardBorder): border is 'rainbow' | 'vine' {
  return border === 'rainbow' || border === 'vine';
}

/** Stops of the spectrum stroke, warm through cool so the sweep reads as one arc. */
export const SPECTRUM_STOPS: readonly string[] = [
  '#FF6B6B',
  '#FFA94D',
  '#FFD43B',
  '#69DB7C',
  '#4DABF7',
  '#B197FC',
];
