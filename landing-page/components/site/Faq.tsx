import { Plus } from 'lucide-react';

import { FAQ } from '@/lib/content';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * Frequently asked questions.
 *
 * Built on native `<details>` elements: they are keyboard operable, announced
 * correctly and searchable by the browser's find-in-page with no JavaScript,
 * which a hand-rolled accordion only approximates.
 */
export function Faq(): React.JSX.Element {
  return (
    <section id="faq" className="py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Questions" title="The short answers." align="center" />

        <div className="mt-12 divide-y divide-line border-y border-line">
          {FAQ.map((item, index) => (
            <Reveal key={item.question} delay={index * 0.05}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-[17px] leading-snug sm:text-lg">
                    {item.question}
                  </span>
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted transition-all duration-300 group-hover:border-accent group-hover:text-accent-strong group-open:rotate-45"
                  >
                    <Plus className="size-4" strokeWidth={1.75} />
                  </span>
                </summary>
                <p className="pb-6 text-[15px] leading-relaxed text-pretty text-muted">
                  {item.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
