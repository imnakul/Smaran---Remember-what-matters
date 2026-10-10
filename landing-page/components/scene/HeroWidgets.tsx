'use client';

import { motion, useReducedMotion } from 'motion/react';
import { BellRing, Check, Flame } from 'lucide-react';
import type { ReactNode } from 'react';

import { BRAND } from '@/lib/content';

/** Daily completion share for the streak widget's bars, oldest first. */
const STREAK_WEEK: readonly number[] = [0.55, 0.8, 0.4, 1, 0.7, 0.9, 1];

interface FloatProps {
  readonly children: ReactNode;
  readonly className: string;
  /** Seconds before the widget arrives, so the three land one after another. */
  readonly delay: number;
  /** Seconds per bob. Each widget gets its own so they never move in step. */
  readonly period: number;
  /** Pixels of vertical travel per bob. */
  readonly drift: number;
}

/**
 * Positions a widget and gives it an entrance and an idle drift.
 *
 * The two motions are on separate elements: the entrance runs once on the
 * outer one, the bob loops on the inner, so the loop never fights the
 * entrance for the same transform.
 */
function Float({ children, className, delay, period, drift }: FloatProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`absolute z-20 ${className}`}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18, scale: 0.94 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={prefersReducedMotion ? undefined : { y: [0, -drift, 0] }}
        transition={{ duration: period, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Three frosted widgets floating off the hero device: a reminder arriving, a
 * sync confirmation and the streak.
 *
 * Each one is a real behaviour of the app, taken out of the screen and set in
 * the scene, so the hero shows what Smaran *does* through the day and not
 * only the list it keeps. They are decorative restatements of copy elsewhere
 * on the page, so they are hidden from assistive tech, and they only appear
 * where there is room beside the device: never on a phone, where they would
 * cover it, and only the sync pill at `lg`, where the two-column hero leaves
 * the device too little margin for the other two.
 */
export function HeroWidgets(): React.JSX.Element {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
      {/* A reminder notification, arriving over the top-left of the device. */}
      <Float className="top-[5%] -left-[40%] w-[248px] lg:hidden xl:block xl:-left-[68%]" delay={0.9} period={7} drift={8}>
        <div className="glass rounded-[20px] p-3.5">
          <div className="flex items-center gap-2 text-[10px] tracking-wide" style={{ color: 'var(--scene-ink-soft)' }}>
            <span
              className="grid size-5 place-items-center rounded-md"
              style={{
                background: 'linear-gradient(150deg, #d9a08d, #c18370)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              <BellRing className="size-3 text-white" strokeWidth={2.2} />
            </span>
            <span className="font-semibold">{BRAND.name}</span>
            <span className="opacity-70">· now</span>
          </div>
          <p className="mt-2 text-[13px] leading-snug font-medium">Call Ma before the week runs out.</p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--scene-ink-soft)' }}>
            Today · 7:00 pm
          </p>
        </div>
      </Float>

      {/* Sync confirmation, tucked under the bottom-left corner. */}
      <Float className="bottom-[16%] -left-[22%] lg:-left-[30%]" delay={1.15} period={8.5} drift={6}>
        <div className="glass flex items-center gap-2.5 rounded-full py-2 pr-4 pl-2">
          <span
            className="grid size-7 place-items-center rounded-full"
            style={{
              background: 'color-mix(in oklab, var(--scene-accent) 26%, transparent)',
              color: 'var(--scene-accent)',
              boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--scene-accent) 40%, transparent)',
            }}
          >
            <Check className="size-3.5" strokeWidth={2.6} />
          </span>
          <span className="text-[12px] leading-tight">
            <span className="block font-semibold">Synced with Notion</span>
            <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--scene-ink-soft)' }}>
              <span className="pulse-dot size-1.5 rounded-full" style={{ background: 'var(--scene-accent)' }} />
              5 collections · just now
            </span>
          </span>
        </div>
      </Float>

      {/* The streak, off the right edge. */}
      <Float className="top-[44%] -right-[22%] w-[150px] lg:hidden xl:block xl:-right-[40%]" delay={1.35} period={9} drift={10}>
        <div className="glass rounded-[20px] p-3.5">
          <div className="flex items-center gap-1.5">
            <Flame className="size-3.5" strokeWidth={2} style={{ color: '#e0b26a' }} />
            <span className="text-[18px] leading-none font-semibold tabular-nums">6</span>
            <span className="text-[11px]" style={{ color: 'var(--scene-ink-soft)' }}>
              day streak
            </span>
          </div>
          <div className="mt-3 flex h-9 items-end gap-1">
            {STREAK_WEEK.map((share, index) => (
              <span
                key={index}
                className="flex-1 rounded-[3px]"
                style={{
                  height: `${Math.round(share * 100)}%`,
                  background:
                    index === STREAK_WEEK.length - 1
                      ? 'linear-gradient(180deg, #f0cf8f, #c9a35a)'
                      : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
          </div>
        </div>
      </Float>
    </div>
  );
}
