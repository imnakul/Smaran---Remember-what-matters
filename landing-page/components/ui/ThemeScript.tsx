import { THEME_STORAGE_KEY } from '@/lib/themeStorage';

/*
 * Runs before first paint and before hydration, so the correct theme is on the
 * document by the time anything is drawn. Without this the page would paint in
 * light mode and then snap to dark for anyone who prefers it -- the classic
 * theme flash. It is deliberately tiny, synchronous and dependency-free.
 *
 * Every branch is wrapped in try/catch because `localStorage` throws outright
 * in some privacy modes rather than returning null.
 */
const script = `(function(){try{var stored=localStorage.getItem('${THEME_STORAGE_KEY}');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=stored==='light'||stored==='dark'?stored:(prefersDark?'dark':'light');document.documentElement.setAttribute('data-theme',theme);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export function ThemeScript(): React.JSX.Element {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
