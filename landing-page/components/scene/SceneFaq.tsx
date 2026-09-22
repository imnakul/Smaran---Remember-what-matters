import { Plus } from 'lucide-react';

import { FAQ } from '@/lib/content';
import { Reveal } from '@/components/ui/Reveal';
import { Glass } from './Glass';
import { SceneHeading } from './SceneHeading';

/**
 * Frequently asked questions, on a single pane.
 *
 * Native `<details>` again: keyboard operable, announced correctly and found
 * by the browser's find-in-page, none of which a hand-rolled accordion gets
 * for free.
 */
export function SceneFaq(): React.JSX.Element {
  return (
    <section id="scene-faq" className="relative py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SceneHeading eyebrow="Questions" title="The short answers." align="center" />

        <Reveal delay={0.05}>
          <Glass tone="strong" className="mt-12 rounded-round px-6 sm:px-8">
            <div className="divide-y divide-white/12">
              {FAQ.map((item) => (
                <details key={item.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                    <span className="font-display text-[17px] leading-snug sm:text-lg">
                      {item.question}
                    </span>
                    <span
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-white/25 transition-all duration-300 group-open:rotate-45 group-hover:border-[var(--scene-accent)]"
                      style={{ color: 'var(--scene-ink-soft)' }}
                    >
                      <Plus className="size-4" strokeWidth={1.75} />
                    </span>
                  </summary>
                  <p
                    className="pb-6 text-[15px] leading-relaxed text-pretty"
                    style={{ color: 'var(--scene-ink-muted)' }}
                  >
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </Glass>
        </Reveal>
      </div>
    </section>
  );
}
