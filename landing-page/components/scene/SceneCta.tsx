import { Download } from 'lucide-react';

import { BRAND, LINKS } from '@/lib/content';
import { GithubIcon } from '@/components/ui/GithubIcon';
import { Logo } from '@/components/ui/Logo';
import { Reveal } from '@/components/ui/Reveal';
import { Glass } from './Glass';

export function SceneCta(): React.JSX.Element {
  return (
    <section className="relative py-20 sm:py-28">
      <Reveal className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Glass tone="strong" className="rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-16">
          <Logo className="mx-auto size-12 text-[var(--scene-ink)]" />

          <h2 className="font-display mt-8 text-4xl leading-[1.1] text-balance sm:text-5xl">
            Start with one thought
            <br />
            worth keeping.
          </h2>

          <p
            className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-pretty sm:text-lg"
            style={{ color: 'var(--scene-ink-muted)' }}
          >
            {BRAND.name} is free, has no account, and asks for nothing you would not already
            give a paper notebook.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={LINKS.playStore}
              className="group inline-flex items-center gap-2 rounded-pill bg-[var(--scene-ink)] px-7 py-3.5 text-sm font-semibold text-[#0d1410] transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Download
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                strokeWidth={2}
              />
              Get it for Android
            </a>
            <a
              href={LINKS.github}
              className="inline-flex items-center gap-2 rounded-pill border border-white/25 px-7 py-3.5 text-sm font-semibold transition-colors duration-300 hover:border-white/50 hover:bg-white/10"
            >
              <GithubIcon className="size-4" />
              Source on GitHub
            </a>
          </div>

          <p lang="sa" className="font-display mt-12 text-lg" style={{ color: 'var(--scene-accent)' }}>
            {BRAND.devanagari}
          </p>
        </Glass>
      </Reveal>
    </section>
  );
}
