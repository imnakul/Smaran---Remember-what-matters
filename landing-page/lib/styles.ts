import type { CSSProperties } from 'react';

/**
 * A style object that also accepts CSS custom properties.
 *
 * React's `CSSProperties` has no index signature for `--*` keys, so setting a
 * custom property inline otherwise requires casting at every call site. A
 * template-literal index signature expresses the same thing once, and keeps the
 * rest of the style object fully typed.
 */
export interface ThemedStyle extends CSSProperties {
  readonly [key: `--${string}`]: string | number | undefined;
}

/**
 * Shared geometry for a pair of calls to action that sit side by side.
 *
 * It deliberately omits the border. Every variant must supply its own 1px one
 * -- `border border-transparent` for a filled button -- because a border
 * participates in the box, so a button without one renders 2px shorter than
 * the outlined or frosted button beside it. Horizontal padding is left to the
 * call site, since the hero and the closing block use different sizes.
 *
 * Keeping the rest in one constant is what stops the two from drifting apart
 * again the next time one of them is restyled.
 */
export const CTA_BASE =
  'group inline-flex items-center justify-center gap-2 rounded-pill py-3.5 text-sm font-semibold transition-transform duration-300 active:scale-[0.98]';
