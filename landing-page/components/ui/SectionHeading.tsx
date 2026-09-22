import type { ReactNode } from 'react';

import { Reveal } from './Reveal';

interface SectionHeadingProps {
  /** Small label above the title. */
  readonly eyebrow: string;
  readonly title: ReactNode;
  readonly lede?: string;
  /** Centres the block. Left-aligned by default, which suits editorial layouts. */
  readonly align?: 'left' | 'center';
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
}: SectionHeadingProps): React.JSX.Element {
  const isCentered = align === 'center';

  return (
    <Reveal className={`max-w-2xl ${isCentered ? 'mx-auto text-center' : ''}`}>
      <p className="font-grotesk text-[11px] tracking-[0.2em] text-accent-strong uppercase">{eyebrow}</p>
      <h2 className="font-display mt-4 text-3xl leading-[1.15] text-balance sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {lede ? (
        <p className="mt-4 text-base leading-relaxed text-pretty text-muted sm:text-lg">{lede}</p>
      ) : null}
    </Reveal>
  );
}
