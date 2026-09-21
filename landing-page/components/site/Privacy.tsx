import { Smartphone, FileText, ServerOff } from 'lucide-react';

import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface DataNode {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly icon: typeof Smartphone;
  readonly tone: 'primary' | 'optional' | 'absent';
}

const NODES: readonly DataNode[] = [
  {
    id: 'device',
    title: 'Your phone',
    body: 'Every thought is written here first, and works here alone.',
    icon: Smartphone,
    tone: 'primary',
  },
  {
    id: 'notion',
    title: 'Your Notion',
    body: 'Optional. Your workspace, your databases, your token.',
    icon: FileText,
    tone: 'optional',
  },
  {
    id: 'servers',
    title: 'Our servers',
    body: 'There are none. Nothing to breach, bill or shut down.',
    icon: ServerOff,
    tone: 'absent',
  },
] as const;

/**
 * The data-flow section.
 *
 * Drawn as three nodes rather than written as a claim, with the third one
 * struck through: the absence of a backend is the actual product decision, and
 * showing the empty slot makes that land harder than a sentence would.
 */
export function Privacy(): React.JSX.Element {
  return (
    <section id="privacy" className="relative bg-sunken py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Where your words live"
          title="Three places your thoughts could go. Smaran uses one."
          lede="There is no Smaran account because there is no Smaran server. The only copy that leaves your device is the one you deliberately send to your own Notion."
          align="center"
        />

        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {NODES.map((node, index) => {
            const Icon = node.icon;
            const isAbsent = node.tone === 'absent';

            return (
              <Reveal as="li" key={node.id} delay={index * 0.1}>
                <div
                  className={`flex h-full flex-col rounded-round border p-6 transition-colors duration-500 ${
                    isAbsent
                      ? 'border-dashed border-line-strong bg-transparent'
                      : 'border-line bg-raised shadow-card'
                  }`}
                >
                  <span
                    className={`grid size-11 place-items-center rounded-soft ${
                      node.tone === 'primary'
                        ? 'bg-accent-solid text-accent-on-solid'
                        : node.tone === 'optional'
                          ? 'bg-accent/10 text-accent-strong'
                          : 'bg-pill text-muted'
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>

                  <h3
                    className={`font-display mt-5 text-lg ${
                      isAbsent ? 'text-muted line-through decoration-2' : ''
                    }`}
                  >
                    {node.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-pretty text-muted">
                    {node.body}
                  </p>

                  {node.tone === 'optional' ? (
                    <span className="font-grotesk mt-4 inline-flex w-fit rounded-pill bg-pill px-2.5 py-1 text-[10px] tracking-[0.14em] text-muted uppercase">
                      Opt-in
                    </span>
                  ) : null}
                </div>
              </Reveal>
            );
          })}
        </ol>

        <Reveal delay={0.3}>
          <p className="font-hand mx-auto mt-10 max-w-md text-center text-xl text-muted">
            your data was never ours to lose
          </p>
        </Reveal>
      </div>
    </section>
  );
}
