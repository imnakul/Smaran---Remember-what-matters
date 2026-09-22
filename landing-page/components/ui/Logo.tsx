import Image from 'next/image';

interface LogoProps {
  /**
   * Sizing for the mark. Set a height and leave the width automatic
   * (`h-7 w-auto`) — the artwork is slightly taller than it is wide, so a
   * square utility such as `size-7` would squash it.
   */
  readonly className?: string;
}

/**
 * The Smaran mark: the app's own quill-in-a-ring icon.
 *
 * `public/logo.png` is derived from `assets/icon.png` in the Expo workspace,
 * with its solid black plate matted out to alpha so the same file sits on the
 * light paper page, the dark theme and the frosted panels of the scene variant
 * without a box around it.
 *
 * It is decorative in every current placement — the brand name or the heading
 * beside it already carries the meaning — so the alt text is intentionally
 * empty rather than repeating "Smaran" to a screen reader twice.
 */
export function Logo({ className = '' }: LogoProps): React.JSX.Element {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={471}
      height={512}
      priority
      className={className}
    />
  );
}
