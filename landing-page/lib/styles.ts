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
