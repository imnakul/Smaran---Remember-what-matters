import { Brain, BookOpen, Sparkles, Quote, Zap, Flame, Settings, Focus, Plus, Check } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { ThemedStyle } from '@/lib/styles';
import {
  ACCENTS,
  type AccentOption,
  type CardBorder,
  type TypefaceOption,
} from '@/lib/theme';

/** Everything the live preview lets a visitor change. */
export interface PreviewConfig {
  readonly accent: AccentOption;
  /**
   * Card corner radius in pixels. Held as a number rather than one of the
   * app's four named presets because the app also exposes a free slider
   * (`customCornerRadius`), and the preview should be able to show that.
   */
  readonly cornerRadius: number;
  readonly border: CardBorder;
  readonly typeface: TypefaceOption;
  readonly dark: boolean;
}

export interface PreviewThought {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly done: boolean;
  /** Index into `ACCENTS`, used only when the screen is not accent-locked. */
  readonly accentIndex: number;
}

export const SAMPLE_THOUGHTS: readonly PreviewThought[] = [
  { id: 't1', title: 'Simplicity is the prerequisite for reliability.', meta: 'Repeats every 1 day', done: true, accentIndex: 0 },
  { id: 't2', title: 'Call Ma before the week runs out.', meta: 'Today · 7:00 pm', done: false, accentIndex: 2 },
  { id: 't3', title: 'The chai on the balcony at 6am.', meta: 'Blessings · added yesterday', done: false, accentIndex: 4 },
  { id: 't4', title: 'Walk after dinner. No phone.', meta: 'Repeats every 1 day', done: false, accentIndex: 1 },
] as const;

const TAB_ICONS = [Brain, BookOpen, Sparkles, Quote, Zap] as const;
const TAB_LABELS = ['Remember', 'Learnings', 'Blessings', 'Sayings', 'Try Doing'] as const;

const WEEK = [
  { day: 'Thu', date: 13 },
  { day: 'Fri', date: 14 },
  { day: 'Sat', date: 15 },
  { day: 'Sun', date: 16 },
  { day: 'Mon', date: 17 },
  { day: 'Tue', date: 18 },
  { day: 'Wed', date: 19 },
] as const;

/** The selected day, fixed so server and client markup always agree. */
const SELECTED_DATE = 16;

/**
 * Resolves the edge treatment for a card. Mirrors the app's `BORDER_OPTIONS`:
 * most are plain borders, and `neon` adds a bleed around the lit edge.
 */
function borderStyle(border: CardBorder, accent: string): CSSProperties {
  switch (border) {
    case 'left':
      return { borderLeft: `4px solid ${accent}` };
    case 'all':
      return { border: `1px solid ${accent}` };
    case 'dashed':
      return { border: `1px dashed ${accent}` };
    case 'neon':
      return { border: `1px solid ${accent}`, boxShadow: `0 0 10px -1px ${accent}` };
    case 'none':
      return {};
  }
}

interface ProgressRingProps {
  readonly value: number;
  readonly total: number;
  readonly accent: string;
}

function ProgressRing({ value, total, accent }: ProgressRingProps): React.JSX.Element {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = total === 0 ? 0 : value / total;

  return (
    <svg viewBox="0 0 24 24" className="size-6 -rotate-90" aria-hidden>
      <circle cx="12" cy="12" r={radius} fill="none" stroke="var(--s-line)" strokeWidth="2.5" />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
      />
    </svg>
  );
}

interface AppScreenProps {
  readonly config: PreviewConfig;
  readonly thoughts?: readonly PreviewThought[];
  /**
   * When true every card uses `config.accent` instead of its own colour. The
   * playground turns this on so a colour change is visible across the whole
   * screen; the hero leaves it off, which is how the app really looks once a
   * few thoughts carry different colours.
   */
  readonly lockAccent?: boolean;
  /** Which collection tab reads as active. */
  readonly activeTab?: number;
}

/**
 * A faithful HTML recreation of Smaran's home screen.
 *
 * This is drawn rather than screenshotted for three reasons: it stays sharp at
 * every size, it re-themes live from `config`, and it contains no real user
 * data. Its colours come from scoped `--s-*` custom properties rather than the
 * page's own theme utilities, so a dark phone can sit on a light page.
 */
export function AppScreen({
  config,
  thoughts = SAMPLE_THOUGHTS,
  lockAccent = false,
  activeTab = 0,
}: AppScreenProps): React.JSX.Element {
  const { accent, cornerRadius, border, typeface, dark } = config;

  const screenStyle: ThemedStyle = {
    '--s-bg': dark ? '#141416' : '#FDFDF9',
    '--s-surface': dark ? '#1F1F23' : '#FFFFFF',
    '--s-text': dark ? '#F1F1EF' : '#2D2D2D',
    '--s-muted': dark ? '#9A9A9E' : '#8B8B8B',
    '--s-line': dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    '--s-pill': dark ? 'rgba(255,255,255,0.08)' : 'rgba(45,45,45,0.05)',
    '--s-accent': accent.accent,
    '--s-radius': `${cornerRadius}px`,
  };

  const done = thoughts.filter((thought) => thought.done).length;

  return (
    <div
      style={screenStyle}
      className={`${typeface.className} flex h-full flex-col bg-[var(--s-bg)] text-[var(--s-text)] transition-colors duration-500`}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] font-medium text-[var(--s-text)]">
        <span>10:25</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-[7px] w-[3px] rounded-[1px] bg-current opacity-80" />
          <span className="inline-block h-[9px] w-[3px] rounded-[1px] bg-current opacity-80" />
          <span className="inline-block h-[11px] w-[3px] rounded-[1px] bg-current" />
          <span className="ml-1 rounded-[3px] border border-current px-[3px] py-[1px] text-[7px] leading-none">
            86
          </span>
        </span>
      </div>

      {/* Streak + settings */}
      <div className="flex items-center justify-between px-4 pt-2">
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: 'var(--s-pill)', color: accent.accent }}
        >
          <Flame className="size-3" strokeWidth={2} />6
        </span>
        <Settings className="size-4 text-[var(--s-muted)]" strokeWidth={1.75} />
      </div>

      {/* Date strip */}
      <div className="flex justify-between gap-1 px-3 pt-3">
        {WEEK.map((item) => {
          const isSelected = item.date === SELECTED_DATE;
          return (
            <div
              key={item.date}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors duration-300"
              style={
                isSelected
                  ? { background: accent.accent, color: '#FFFFFF' }
                  : { color: 'var(--s-muted)' }
              }
            >
              <span className="text-[8px] leading-none opacity-80">{item.day}</span>
              <span className="text-[12px] leading-none font-semibold">{item.date}</span>
            </div>
          );
        })}
      </div>

      {/* Progress row */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="flex items-center gap-2">
          <ProgressRing value={done} total={thoughts.length} accent={accent.accent} />
          <span className="text-[11px] text-[var(--s-muted)]">
            {done}/{thoughts.length} Completed
          </span>
        </span>
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] text-[var(--s-muted)]"
          style={{ background: 'var(--s-pill)' }}
        >
          <Focus className="size-3" strokeWidth={1.75} />
          Focus
        </span>
      </div>

      {/* Thought list */}
      <div className="mt-3 flex flex-1 flex-col gap-2 overflow-hidden px-4">
        {thoughts.map((thought) => {
          const cardAccent = lockAccent ? accent : ACCENTS[thought.accentIndex % ACCENTS.length];
          const wash = dark ? cardAccent.darkWash : cardAccent.wash;

          return (
            <div
              key={thought.id}
              className="flex items-start justify-between gap-3 p-3 transition-all duration-500"
              style={{
                background: wash,
                borderRadius: 'var(--s-radius)',
                ...borderStyle(border, cardAccent.accent),
              }}
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[12px] leading-snug font-medium ${
                    thought.done ? 'line-through opacity-50' : ''
                  }`}
                >
                  {thought.title}
                </span>
                <span className="mt-1 block text-[9px] text-[var(--s-muted)]">{thought.meta}</span>
              </span>

              <span
                className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-300"
                style={{
                  borderColor: cardAccent.accent,
                  background: thought.done ? cardAccent.accent : 'transparent',
                }}
              >
                {thought.done ? <Check className="size-2.5 text-white" strokeWidth={3.5} /> : null}
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating action button */}
      <div className="flex justify-end px-4 pb-2">
        <span
          className="grid size-11 place-items-center rounded-full text-white shadow-lg transition-colors duration-300"
          style={{ background: accent.accent, boxShadow: `0 8px 20px -6px ${accent.accent}` }}
        >
          <Plus className="size-5" strokeWidth={2.25} />
        </span>
      </div>

      {/* Collection tab bar */}
      <div
        className="flex items-center justify-around border-t px-2 pt-2 pb-5"
        style={{ borderColor: 'var(--s-line)', background: 'var(--s-surface)' }}
      >
        {TAB_ICONS.map((Icon, index) => {
          const isActive = index === activeTab;
          return (
            <span
              key={TAB_LABELS[index]}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-colors duration-300"
              style={
                isActive
                  ? { background: dark ? cardTint(accent.accent, 0.18) : accent.wash, color: accent.accent }
                  : { color: 'var(--s-muted)' }
              }
            >
              <Icon className="size-[15px]" strokeWidth={isActive ? 2 : 1.6} />
              <span className="text-[7px] leading-none font-medium">{TAB_LABELS[index]}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Mixes an accent toward transparency for dark-mode tints. `color-mix` keeps
 * this correct for the custom colours the app's hue picker can produce, where a
 * hand-written tint table would not reach.
 */
function cardTint(color: string, amount: number): string {
  return `color-mix(in oklab, ${color} ${Math.round(amount * 100)}%, transparent)`;
}
