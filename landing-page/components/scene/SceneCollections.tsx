import { COLLECTIONS } from '@/lib/content';
import { ACCENTS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';
import { Glass } from './Glass';
import { SceneHeading } from './SceneHeading';

/** Accent tint for a dark ground — mixed to transparent so the scene shows through. */
function tint(color: string, amount = 26): string {
  return `color-mix(in oklab, ${color} ${amount}%, transparent)`;
}

export function SceneCollections(): React.JSX.Element {
  return (
    <section id="scene-collections" className="relative py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SceneHeading
          eyebrow="Five collections"
          title={
            <>
              One app, five ways of
              <br className="hidden sm:block" /> remembering.
            </>
          }
          lede="A quote is not a chore and a blessing is not a habit. Smaran keeps them apart, each with its own tab, its own colour and its own rhythm."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {COLLECTIONS.map((collection, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            const Icon = collection.icon;

            return (
              <Reveal
                as="li"
                key={collection.id}
                delay={index * 0.07}
                /* First row takes three cards, second row two wider ones. */
                className={index < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}
              >
                <Glass
                  as="article"
                  tone="strong"
                  className="group flex h-full flex-col rounded-round p-6 transition-transform duration-500 hover:-translate-y-1"
                >
                  <span
                    className="grid size-11 place-items-center rounded-soft transition-transform duration-500 group-hover:scale-110"
                    style={{ background: tint(accent.accent), color: accent.accent }}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>

                  <h3 className="font-display mt-5 text-lg">{collection.label}</h3>
                  <p className="mt-1 mb-5 text-[13px]" style={{ color: 'var(--scene-ink-muted)' }}>
                    {collection.description}
                  </p>

                  {/*
                    The sample keeps full-strength ink on a faint accent plate:
                    accent-on-accent would not clear 4.5:1 for the lighter notes.
                  */}
                  <p
                    className="mt-auto rounded-soft p-3 text-[13px] leading-snug"
                    style={{ background: tint(accent.accent, 16), color: 'var(--scene-ink)' }}
                  >
                    {collection.sample}
                  </p>
                </Glass>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
