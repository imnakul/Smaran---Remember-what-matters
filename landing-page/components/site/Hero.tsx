'use client';

import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, Download } from 'lucide-react';

import { BRAND, LINKS } from '@/lib/content';
import { CTA_BASE } from '@/lib/styles';
import { CORNER_RADIUS, DEFAULT_ACCENT, TYPEFACES } from '@/lib/theme';
import { AppScreen, type PreviewConfig } from '@/components/mockup/AppScreen';
import { PhoneFrame } from '@/components/mockup/PhoneFrame';
import { useTheme } from '@/lib/useTheme';

/** The hero phone shows the app at its defaults: sage, round corners, no edge. */
const HERO_CONFIG: Omit<PreviewConfig, 'dark'> = {
  accent: DEFAULT_ACCENT,
  cornerRadius: CORNER_RADIUS.round,
  border: 'none',
  typeface: TYPEFACES[0],
};

const TRUST_POINTS: readonly string[] = ['No account', 'Works offline', 'Your data stays yours'];

export function Hero(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const { theme } = useTheme();

  // The hero phone mirrors the site theme, so the page reads as one surface.
  const config: PreviewConfig = { ...HERO_CONFIG, dark: theme === 'dark' };

  const rise = (delay: number) =>
    prefersReducedMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section id="top" className="grain relative overflow-hidden pt-28 pb-16 sm:pt-36 lg:pt-44 lg:pb-28">
      {/* Atmosphere: a single accent bloom behind the device, plus a faint rule grid. */}
      <div
        aria-hidden
        className="accent-glow pointer-events-none absolute top-[-10%] right-[-20%] hidden size-[38rem] opacity-50 blur-[2px] lg:block"
      />
      <div
        aria-hidden
        className="ruled pointer-events-none absolute inset-x-0 top-1/3 h-[32rem] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-10 lg:px-8">
        {/* Copy */}
        <div className="max-w-xl">
          <motion.h1
            {...rise(0)}
            className="font-display text-[2.6rem] leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-[4.1rem]"
          >
            The things worth
            <br />
            remembering
            <br />
            <span className="relative inline-block">
              aren&rsquo;t tasks.
              {/* Hand-drawn underline: the mark a person would make on paper. */}
              <svg
                aria-hidden
                viewBox="0 0 320 16"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-3 w-full text-accent"
              >
                <motion.path
                  d="M4 10.5C58 4.5 116 3.5 170 6.5C224 9.5 272 10 316 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={prefersReducedMotion ? undefined : { pathLength: 0 }}
                  animate={prefersReducedMotion ? undefined : { pathLength: 1 }}
                  transition={{ duration: 0.9, delay: 0.7, ease: 'easeInOut' }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mt-7 max-w-lg text-base leading-relaxed text-pretty text-muted sm:text-lg"
          >
            {BRAND.name} holds the lines, intentions and small gratitudes you want to return to
            &mdash; and brings them back on the days you asked. Five collections, no inbox, no
            account.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={LINKS.playStore}
              className={`${CTA_BASE} border border-transparent bg-accent-solid px-6 text-accent-on-solid shadow-float hover:-translate-y-0.5 hover:brightness-95`}
            >
              <Download className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" strokeWidth={2} />
              Get it for Android
            </a>
            <a
              href="#make-it-yours"
              className={`${CTA_BASE} border border-line-strong px-6 hover:border-accent hover:text-accent-strong`}
            >
              Make it yours
              <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" strokeWidth={2} />
            </a>
          </motion.div>

          <motion.ul {...rise(0.32)} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-[13px] text-muted">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                {point}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Device */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 40, rotate: -3 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, rotate: -2.5 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          <motion.div
            animate={prefersReducedMotion ? undefined : { y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PhoneFrame label={`${BRAND.name} home screen, showing a day's thoughts across collections`}>
              <AppScreen config={config} />
            </PhoneFrame>
          </motion.div>

          {/* A margin note, in the app's own handwritten face. */}
          <motion.p
            {...rise(0.7)}
            className="font-hand absolute -bottom-14 -left-6 hidden max-w-[8.5rem] -rotate-6 text-lg leading-tight text-muted xl:block"
          >
            &ldquo;one ring, one streak, and nothing shouting at you&rdquo;
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
