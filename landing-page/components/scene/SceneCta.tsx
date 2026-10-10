import { Download } from 'lucide-react';

import { BRAND, LINKS } from '@/lib/content';
import { CTA_BASE } from '@/lib/styles';
import { GithubIcon } from '@/components/ui/GithubIcon';
import { Logo } from '@/components/ui/Logo';
import { Reveal } from '@/components/ui/Reveal';
import { Glass } from './Glass';

export function SceneCta(): React.JSX.Element {
  return (
    <section className="relative py-20 sm:py-28">
      <Reveal className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Glass
          tone="strong"
          className="glass-interactive overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-16"
        >
          {/*
            Aurora: two slow accent blooms behind the copy. They sit under the
            content (z -10 inside the pane's own stacking context) and are faint
            enough that the strong wash still sets the contrast.
          */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-[34rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(closest-side, var(--scene-accent), transparent)' }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -bottom-28 -z-10 size-72 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(closest-side, #c9b674, transparent)' }}
          />

          <span
            className="mx-auto grid size-20 place-items-center rounded-[1.6rem] bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_18px_40px_-18px_rgba(0,0,0,0.9)] ring-1 ring-white/12 ring-inset"
          >
            <Logo className="h-11 w-auto" />
          </span>

          <h2 className="font-display text-luminous mt-8 text-4xl leading-[1.1] text-balance sm:text-5xl">
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
              className={`${CTA_BASE} btn-sheen border border-transparent bg-[var(--scene-ink)] px-7 text-[#0d1410] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5`}
            >
              <Download
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                strokeWidth={2}
              />
              Get it for Android
            </a>
            <a
              href={LINKS.github}
              className={`${CTA_BASE} glass px-7 hover:-translate-y-0.5 hover:bg-white/10`}
            >
              <GithubIcon className="size-4" />
              Source on GitHub
            </a>
          </div>
        </Glass>
      </Reveal>
    </section>
  );
}
