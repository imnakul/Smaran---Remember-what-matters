'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { THEME_STORAGE_KEY } from './themeStorage';

export type Theme = 'light' | 'dark';

export { THEME_STORAGE_KEY };

/**
 * The `data-theme` attribute on `<html>` is the single source of truth. It is
 * set before first paint by `ThemeScript`, so reading it here always returns
 * what the visitor is actually looking at.
 */
function getSnapshot(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Matches the server render, which cannot know the visitor's preference. */
function getServerSnapshot(): Theme {
  return 'light';
}

function hasExplicitPreference(): boolean {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark';
  } catch {
    // Storage throws outright in some privacy modes; treat that as "no choice".
    return false;
  }
}

function subscribe(onStoreChange: () => void): () => void {
  // Re-read whenever anything writes the attribute, including `toggleTheme`.
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  // Follow the OS, but only until the visitor makes an explicit choice.
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = (event: MediaQueryListEvent): void => {
    if (hasExplicitPreference()) return;
    document.documentElement.setAttribute('data-theme', event.matches ? 'dark' : 'light');
  };
  media.addEventListener('change', handleMediaChange);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', handleMediaChange);
  };
}

export interface UseThemeResult {
  readonly theme: Theme;
  readonly toggleTheme: () => void;
}

/**
 * Reads and writes the document theme.
 *
 * Modelled as an external store rather than component state: the theme lives in
 * the DOM before React boots, and `useSyncExternalStore` is the API built for
 * exactly that -- it gives a correct server snapshot for hydration and avoids
 * the cascading render that setting state inside an effect would cause.
 */
export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback((): void => {
    const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark';
    // Writing the attribute notifies the observer above, which re-renders.
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // A visitor in private mode simply loses the preference between visits.
    }
  }, []);

  return { theme, toggleTheme };
}
