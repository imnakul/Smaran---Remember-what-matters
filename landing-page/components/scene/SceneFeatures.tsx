import { FEATURES } from '@/lib/content';
import { Reveal } from '@/components/ui/Reveal';
import { Glass } from './Glass';
import { SceneHeading } from './SceneHeading';

export function SceneFeatures(): React.JSX.Element {
  return (
    <section id="scene-features" className="relative py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SceneHeading
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
                <Glass
                  as="article"
                  tone="strong"
                  className="group flex h-full flex-col rounded-round p-6 transition-transform duration-500 hover:-translate-y-1"
                >
                  <span
                    className="grid size-10 place-items-center rounded-soft transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: 'color-mix(in oklab, var(--scene-accent) 22%, transparent)',
                      color: 'var(--scene-accent)',
                    }}
                  >
                    <Icon className="size-[18px]" strokeWidth={1.75} />
                  </span>

                  <h3 className="font-display mt-5 text-lg leading-snug">{feature.title}</h3>
                  <p
                    className="mt-2 text-[14px] leading-relaxed text-pretty"
                    style={{ color: 'var(--scene-ink-muted)' }}
                  >
                    {feature.body}
                  </p>
                </Glass>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
