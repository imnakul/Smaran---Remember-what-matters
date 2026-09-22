'use client';

import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, Download } from 'lucide-react';

import { BRAND, LINKS } from '@/lib/content';
import { CORNER_RADIUS, DEFAULT_ACCENT, TYPEFACES } from '@/lib/theme';
import type { PreviewConfig } from '@/components/mockup/AppScreen';
import { WallpaperPhone } from './WallpaperPhone';

/** The phone shows the app over the same wallpaper the page is sitting on. */
const HERO_CONFIG: PreviewConfig = {
  accent: DEFAULT_ACCENT,
  cornerRadius: CORNER_RADIUS.round,
  border: 'none',
  typeface: TYPEFACES[0],
  dark: true,
};

const TRUST_POINTS: readonly string[] = ['No account', 'Works offline', 'Your data stays yours'];

export function SceneHero(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const rise = (delay: number) =>
    prefersReducedMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section
      id="scene-top"
      className="relative flex min-h-dvh items-center pt-28 pb-24 sm:pt-32 lg:pt-36 lg:pb-32"
    >
      {/*
        Local scrim. The hero's copy sits on the scene itself rather than on a
        pane, so it carries its own gradient -- without it, light type over the
        brightest part of the illustration would fall under 4.5:1.
      */}
      <div aria-hidden className="text-scrim absolute inset-y-0 left-0 w-full lg:w-[70%]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-10 lg:px-8">
        <div className="max-w-xl">
          <motion.p
            {...rise(0)}
            className="font-grotesk flex items-center gap-2.5 text-[11px] tracking-[0.22em] uppercase"
            style={{ color: 'var(--scene-ink-muted)' }}
          >
            <span lang="sa" className="text-base tracking-normal" style={{ color: 'var(--scene-accent)' }}>
              {BRAND.devanagari}
            </span>
            <span aria-hidden className="h-px w-6 bg-white/30" />
            Sanskrit for remembrance
          </motion.p>

          <motion.h1
            {...rise(0.08)}
            className="font-display mt-6 text-[2.7rem] leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-[4.2rem]"
          >
            A quiet place
            <br />
            for the thoughts
            <br />
            <span className="relative inline-block">
              you keep.
              <svg
                aria-hidden
                viewBox="0 0 300 16"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-3 w-full"
                style={{ color: 'var(--scene-accent)' }}
              >
                <motion.path
                  d="M4 10.5C54 4.5 108 3.5 158 6.5C208 9.5 254 10 296 5.5"
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
            className="mt-7 max-w-lg text-base leading-relaxed text-pretty sm:text-lg"
            style={{ color: 'var(--scene-ink-muted)' }}
          >
            Set your own wallpaper, and {BRAND.name} becomes part of it — frosted cards
            over a view you chose. Five collections, no inbox, no account.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={LINKS.playStore}
              className="group inline-flex items-center gap-2 rounded-pill bg-[var(--scene-ink)] px-6 py-3.5 text-sm font-semibold text-[#0d1410] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Download
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                strokeWidth={2}
              />
              Get it for Android
            </a>
            {/* Uses the glass recipe directly: wrapping an anchor in <Glass as="a"> would nest anchors. */}
            <a
              href="#scene-yours"
              className="glass group inline-flex items-center gap-2 rounded-pill px-6 py-3.5 text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5"
            >
              Make it yours
              <ArrowDown
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                strokeWidth={2}
              />
            </a>
          </motion.div>

          <motion.ul {...rise(0.32)} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2 text-[13px]"
                style={{ color: 'var(--scene-ink-muted)' }}
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ background: 'var(--scene-accent)' }}
                />
                {point}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 44, rotate: -3 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, rotate: -2.5 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <motion.div
            animate={prefersReducedMotion ? undefined : { y: [0, -14, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <WallpaperPhone
              config={HERO_CONFIG}
              label={`${BRAND.name} home screen over a personal wallpaper, with frosted cards`}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
