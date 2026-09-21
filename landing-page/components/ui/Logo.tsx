interface LogoProps {
  readonly className?: string;
}

/**
 * The Smaran mark: a ring of mala beads with one bead lit.
 *
 * Smaran is the practice of returning to a thought, and a japa mala is the
 * oldest instrument for exactly that -- a loop you come back around. The lit
 * bead is the thought currently held, which is also what the app's progress
 * ring draws.
 */
export function Logo({ className = '' }: LogoProps): React.JSX.Element {
  const beads = Array.from({ length: 12 }, (_, index) => index);

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      {beads.map((index) => {
        const angle = (index / beads.length) * Math.PI * 2 - Math.PI / 2;
        const cx = 16 + Math.cos(angle) * 11;
        const cy = 16 + Math.sin(angle) * 11;
        const isLit = index === 0;

        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={isLit ? 3 : 1.7}
            fill={isLit ? 'var(--accent)' : 'currentColor'}
            opacity={isLit ? 1 : 0.38}
          />
        );
      })}
    </svg>
  );
}
