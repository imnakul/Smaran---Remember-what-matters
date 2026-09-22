'use client';

import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/lib/useTheme';

/**
 * Day / Dusk control.
 *
 * It drives the same stored preference as the editorial page's light/dark
 * switch, but on the scene that preference means scrim weight rather than a
 * palette flip — the type stays light either way, because it sits on a
 * photograph. The labels say what it actually does here.
 */
export function DayDuskToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDusk = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDusk ? 'Switch to day light' : 'Switch to dusk light'}
      aria-pressed={isDusk}
      className="relative grid size-9 shrink-0 place-items-center rounded-full border border-white/20 text-[var(--scene-ink)] transition-colors duration-300 hover:bg-white/10"
    >
      <Sun
        aria-hidden
        className={`absolute size-4 transition-all duration-500 ${
          isDusk ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
        strokeWidth={1.75}
      />
      <Moon
        aria-hidden
        className={`absolute size-4 transition-all duration-500 ${
          isDusk ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'
        }`}
        strokeWidth={1.75}
      />
    </button>
  );
}
