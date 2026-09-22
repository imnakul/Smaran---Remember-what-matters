import { FEATURES } from '@/lib/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * Capability bento.
 *
 * Two entries span two columns, which breaks the grid's regularity and gives
 * the eye somewhere to land in what would otherwise be ten identical tiles.
 */
export function Features(): React.JSX.Element {
  return (
    <section id="features" className="relative bg-sunken py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What it does"
          title="Quietly capable, loudly private."
          lede="Everything below ships today. Nothing here needs a subscription, a login or a server that could disappear next year."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal
                key={feature.id}
                delay={Math.min(index, 5) * 0.06}
                className={feature.span === 'wide' ? 'sm:col-span-2' : ''}
              >
                <article className="group flex h-full flex-col rounded-round border border-line bg-raised p-6 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-card">
                  <span className="grid size-10 place-items-center rounded-soft bg-accent/10 text-accent transition-transform duration-500 group-hover:scale-110">
                    <Icon className="size-[18px]" strokeWidth={1.75} />
                  </span>

                  <h3 className="font-display mt-5 text-lg leading-snug">{feature.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-pretty text-muted">
                    {feature.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
