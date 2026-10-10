import { Check } from 'lucide-react';

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
                  className="glass-interactive group flex h-full flex-col overflow-hidden rounded-round p-6 transition-transform duration-500 hover:-translate-y-1"
                >
                  {/* The collection's colour, glowing up through the glass from one corner. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-12 -z-10 size-48 rounded-full opacity-50 blur-3xl transition-opacity duration-700 group-hover:opacity-90"
                    style={{ background: tint(accent.accent, 60) }}
                  />

                  <div className="flex items-start justify-between">
                    <span
                      className="grid size-11 place-items-center rounded-soft transition-transform duration-500 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(150deg, ${tint(accent.accent, 42)}, ${tint(accent.accent, 14)})`,
                        color: `color-mix(in oklab, ${accent.accent} 70%, white)`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px ${tint(accent.accent, 34)}, 0 10px 24px -12px ${accent.accent}`,
                      }}
                    >
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span
                      className="font-grotesk text-[11px] tabular-nums"
                      style={{ color: 'var(--scene-ink-muted)' }}
                    >
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="font-display mt-5 text-lg">{collection.label}</h3>
                  <p className="mt-1 mb-5 text-[13px]" style={{ color: 'var(--scene-ink-muted)' }}>
                    {collection.description}
                  </p>

                  {/*
                    The sample keeps full-strength ink on a faint accent plate:
                    accent-on-accent would not clear 4.5:1 for the lighter notes.
                  */}
                  {/*
                    The sample is drawn as the note itself would be in the app:
                    a frosted card with its tick. Full-strength ink on a faint
                    accent plate, since accent-on-accent would not clear 4.5:1.
                  */}
                  <p
                    className="mt-auto flex items-center gap-3 rounded-soft p-3 text-[13px] leading-snug"
                    style={{
                      background: `linear-gradient(125deg, ${tint(accent.accent, 20)}, rgba(255,255,255,0.03))`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px ${tint(accent.accent, 22)}`,
                      color: 'var(--scene-ink)',
                    }}
                  >
                    <span className="min-w-0 flex-1">{collection.sample}</span>
                    <span
                      aria-hidden
                      className="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-500 group-hover:border-transparent"
                      style={{ borderColor: `color-mix(in oklab, ${accent.accent} 80%, white)` }}
                    >
                      <Check
                        className="size-2.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        strokeWidth={3.5}
                        style={{ color: `color-mix(in oklab, ${accent.accent} 70%, white)` }}
                      />
                    </span>
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
