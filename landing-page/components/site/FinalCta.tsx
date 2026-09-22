import { Download } from 'lucide-react';

import { BRAND, LINKS } from '@/lib/content';
import { CTA_BASE } from '@/lib/styles';
import { GithubIcon } from '@/components/ui/GithubIcon';
import { Logo } from '@/components/ui/Logo';
import { Reveal } from '@/components/ui/Reveal';

export function FinalCta(): React.JSX.Element {
  return (
    <section className="grain relative overflow-hidden py-24 sm:py-32">
      <div
        aria-hidden
        className="accent-glow pointer-events-none absolute inset-x-0 bottom-[-40%] mx-auto size-[40rem] opacity-50"
      />

      <Reveal className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        <Logo className="mx-auto size-12 text-ink" />

        <h2 className="font-display mt-8 text-4xl leading-[1.1] text-balance sm:text-5xl">
          Start with one thought
          <br />
          worth keeping.
        </h2>

        <p className="mt-5 text-base leading-relaxed text-pretty text-muted sm:text-lg">
          {BRAND.name} is free, has no account, and asks for nothing you would not
          already give a paper notebook.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href={LINKS.playStore}
            className={`${CTA_BASE} border border-transparent bg-accent-solid px-7 text-accent-on-solid shadow-float hover:-translate-y-0.5 hover:brightness-95`}
          >
            <Download className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" strokeWidth={2} />
            Get it for Android
          </a>
          <a
            href={LINKS.github}
            className={`${CTA_BASE} border border-line-strong px-7 hover:border-accent hover:text-accent-strong`}
          >
            <GithubIcon className="size-4" />
            Source on GitHub
          </a>
        </div>

        <p lang="sa" className="font-display mt-12 text-lg text-accent-strong">
          {BRAND.devanagari}
        </p>
      </Reveal>
    </section>
  );
}
