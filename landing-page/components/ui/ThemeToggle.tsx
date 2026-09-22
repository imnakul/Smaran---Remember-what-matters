'use client';

import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/lib/useTheme';

/**
 * Light/dark switch.
 *
 * `useTheme` returns the light snapshot during hydration and the real theme
 * immediately after, so the icons cross-fade into place rather than mismatching.
 */
export function ThemeToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      className="relative grid size-10 shrink-0 place-items-center rounded-full border border-line bg-raised text-muted transition-colors duration-300 hover:border-line-strong hover:text-ink"
    >
      <Sun
        aria-hidden
        className={`absolute size-[18px] transition-all duration-300 ${
          isDark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
        strokeWidth={1.75}
      />
      <Moon
        aria-hidden
        className={`absolute size-[18px] transition-all duration-300 ${
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'
        }`}
        strokeWidth={1.75}
      />
    </button>
  );
}
