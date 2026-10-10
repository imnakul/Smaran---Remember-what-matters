import type { ReactNode } from 'react';

import { Reveal } from '@/components/ui/Reveal';

interface SceneHeadingProps {
  readonly eyebrow: string;
  readonly title: ReactNode;
  readonly lede?: string;
  readonly align?: 'left' | 'center';
}

/**
 * Section heading: a frosted eyebrow pill, a lit display title and a lede.
 *
 * Type is light on a dark ground here, so the accent is the lifted sage
 * (`--scene-accent`) rather than the deep brand one.
 */
export function SceneHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
}: SceneHeadingProps): React.JSX.Element {
  const isCentered = align === 'center';

  return (
    <Reveal className={`max-w-2xl ${isCentered ? 'mx-auto text-center' : ''}`}>
      <p
        className="glass font-grotesk inline-flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-3 text-[11px] tracking-[0.2em] uppercase"
        style={{ color: 'var(--scene-ink-soft)' }}
      >
        <span
          aria-hidden
          className="size-1.5 rounded-full"
          style={{ background: 'var(--scene-accent)', boxShadow: '0 0 8px var(--scene-accent)' }}
        />
        {eyebrow}
      </p>
      <h2 className="font-display text-luminous mt-5 text-3xl leading-[1.15] text-balance sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {lede ? (
        <p
          className="mt-4 text-base leading-relaxed text-pretty sm:text-lg"
          style={{ color: 'var(--scene-ink-muted)' }}
        >
          {lede}
        </p>
      ) : null}
    </Reveal>
  );
}
