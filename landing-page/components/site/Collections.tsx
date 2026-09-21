import { COLLECTIONS } from '@/lib/content';
import { ACCENTS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * Tints an accent toward transparency.
 *
 * Mixing to transparent rather than to white means the same value works on the
 * light paper and the dark surface, so the section needs no per-theme table.
 */
function tint(color: string): string {
  return `color-mix(in oklab, ${color} 14%, transparent)`;
}

/**
 * The five collections, each shown in its own colour with a real sample line.
 *
 * Laid out as a scroll-snapping row on small screens and a five-up grid from
 * large, which mirrors how the collections appear as tabs in the app itself.
 */
export function Collections(): React.JSX.Element {
  return (
    <section id="collections" className="relative py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Five collections"
          title={
            <>
              One app, five ways of
              <br className="hidden sm:block" /> remembering.
            </>
          }
          lede="A quote is not a chore and a blessing is not a habit. Smaran keeps them apart, each with its own tab, its own colour and its own rhythm."
        />

        <ul
          // Focusable so the scroll region is reachable by keyboard where it
          // actually scrolls; from `lg` it becomes a plain grid.
          tabIndex={0}
          aria-label="Collections, scrollable"
          className="mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {COLLECTIONS.map((collection, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            const Icon = collection.icon;

            return (
              <Reveal
                as="li"
                key={collection.id}
                delay={index * 0.07}
                className="w-[16rem] shrink-0 snap-start lg:w-auto"
              >
                <article className="group flex h-full flex-col rounded-round border border-line bg-raised p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-float">
                  <span
                    className="grid size-11 place-items-center rounded-soft transition-transform duration-500 group-hover:scale-110"
                    style={{ background: tint(accent.accent), color: accent.accent }}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>

                  <h3 className="font-display mt-5 text-lg">{collection.label}</h3>
                  <p className="mt-1 mb-5 text-[13px] text-muted">{collection.description}</p>

                  {/* A sample thought, drawn the way the app would draw it. */}
                  {/*
                    The sample sits on a tinted plate but keeps ink-coloured
                    text: accent-on-accent would fall under 4.5:1 for the
                    lighter notes, and this is body copy, not a label.
                  */}
                  <p
                    className="mt-auto rounded-soft p-3 pt-3 text-[13px] leading-snug text-ink"
                    style={{ background: tint(accent.accent) }}
                  >
                    {collection.sample}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
