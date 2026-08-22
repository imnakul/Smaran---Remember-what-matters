import { FontFamilyId } from '../types';

/**
 * The three weights every family must provide, as Tailwind classes.
 *
 * These are written out as complete literal class names rather than built by
 * interpolation. NativeWind compiles the classes it can *see* in the source, so
 * a name assembled at runtime would resolve to nothing. Spelling all twelve out
 * here means Tailwind emits them all and the runtime lookup below always finds
 * a real style.
 *
 * They are *named* families declared in `tailwind.config.js`, not arbitrary
 * values: `font-[Inter_400Regular]` compiles to `font-weight`, not
 * `font-family`, so it never applied anything.
 */
export interface TypefaceClasses {
  regular: string;
  medium: string;
  semibold: string;
}

export interface TypefaceOption {
  id: FontFamilyId;
  label: string;
  /** One line shown under the label in Settings. */
  description: string;
  classes: TypefaceClasses;
  /** Rendered in the Settings preview so the user sees the face before choosing. */
  sampleClass: string;
}

export const TYPEFACES: Record<FontFamilyId, TypefaceOption> = {
  inter: {
    id: 'inter',
    label: 'Inter',
    description: 'Neutral and highly legible at small sizes.',
    classes: {
      regular: 'font-inter',
      medium: 'font-inter-medium',
      semibold: 'font-inter-semibold',
    },
    sampleClass: 'font-inter-semibold',
  },
  lora: {
    id: 'lora',
    label: 'Lora',
    description: 'A serif with contrast. Reads like a printed page.',
    classes: {
      regular: 'font-lora',
      medium: 'font-lora-medium',
      semibold: 'font-lora-semibold',
    },
    sampleClass: 'font-lora-semibold',
  },
  outfit: {
    id: 'outfit',
    label: 'Outfit',
    description: 'Geometric and rounded. Soft, modern, friendly.',
    classes: {
      regular: 'font-outfit',
      medium: 'font-outfit-medium',
      semibold: 'font-outfit-semibold',
    },
    sampleClass: 'font-outfit-semibold',
  },
  jetbrains: {
    id: 'jetbrains',
    label: 'JetBrains Mono',
    description: 'Fixed width. Every character on its own grid.',
    classes: {
      regular: 'font-mono',
      medium: 'font-mono-medium',
      semibold: 'font-mono-semibold',
    },
    sampleClass: 'font-mono-semibold',
  },
  caveat: {
    id: 'caveat',
    label: 'Caveat (Handwritten)',
    description: 'Natural handwriting cursive feel with fluid personality.',
    classes: {
      regular: 'font-caveat',
      medium: 'font-caveat-medium',
      semibold: 'font-caveat-semibold',
    },
    sampleClass: 'font-caveat-semibold',
  },
  jakarta: {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    description: 'Crisp contemporary sans with geometric clarity and warmth.',
    classes: {
      regular: 'font-jakarta',
      medium: 'font-jakarta-medium',
      semibold: 'font-jakarta-semibold',
    },
    sampleClass: 'font-jakarta-semibold',
  },
  grotesk: {
    id: 'grotesk',
    label: 'Space Grotesk',
    description: 'Distinctive neo-grotesque display with mechanical flair.',
    classes: {
      regular: 'font-grotesk',
      medium: 'font-grotesk-medium',
      semibold: 'font-grotesk-semibold',
    },
    sampleClass: 'font-grotesk-semibold',
  },
};

/** Ordered for the Settings picker: default first, then by how far it departs from it. */
export const TYPEFACE_LIST: readonly TypefaceOption[] = [
  TYPEFACES.inter,
  TYPEFACES.jakarta,
  TYPEFACES.outfit,
  TYPEFACES.lora,
  TYPEFACES.caveat,
  TYPEFACES.grotesk,
  TYPEFACES.jetbrains,
];
