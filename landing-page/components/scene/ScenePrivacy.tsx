import { Smartphone, FileText, ServerOff } from 'lucide-react';

import { Reveal } from '@/components/ui/Reveal';
import { SceneHeading } from './SceneHeading';

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

export function ScenePrivacy(): React.JSX.Element {
  return (
    <section id="scene-privacy" className="relative py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SceneHeading
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
                {/*
                  The empty slot is drawn as an outline rather than a pane: the
                  absence of a backend is the product decision, and showing the
                  gap lands harder than a sentence claiming it.
                */}
                <div
                  className={
                    isAbsent
                      ? 'flex h-full flex-col rounded-round border border-dashed border-white/25 p-6'
                      : 'glass-strong glass-interactive flex h-full flex-col rounded-round p-6'
                  }
                >
                  <span
                    className="grid size-11 place-items-center rounded-soft"
                    style={
                      node.tone === 'primary'
                        ? {
                            background:
                              'linear-gradient(150deg, color-mix(in oklab, var(--scene-accent) 70%, white), var(--scene-accent))',
                            color: '#0d1410',
                            boxShadow:
                              'inset 0 1px 0 rgba(255,255,255,0.5), 0 12px 28px -12px var(--scene-accent)',
                          }
                        : node.tone === 'optional'
                          ? {
                              background: 'color-mix(in oklab, var(--scene-accent) 22%, transparent)',
                              color: 'var(--scene-accent)',
                            }
                          : { background: 'rgba(255,255,255,0.08)', color: 'var(--scene-ink-soft)' }
                    }
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>

                  <h3
                    className={`font-display mt-5 text-lg ${isAbsent ? 'line-through decoration-2' : ''}`}
                    style={isAbsent ? { color: 'var(--scene-ink-soft)' } : undefined}
                  >
                    {node.title}
                  </h3>
                  <p
                    className="mt-2 text-[14px] leading-relaxed text-pretty"
                    style={{ color: isAbsent ? 'var(--scene-ink-soft)' : 'var(--scene-ink-muted)' }}
                  >
                    {node.body}
                  </p>

                  {node.tone === 'optional' ? (
                    <span
                      className="font-grotesk mt-4 inline-flex w-fit rounded-pill bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase"
                      style={{ color: 'var(--scene-ink-soft)' }}
                    >
                      Opt-in
                    </span>
                  ) : null}
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
