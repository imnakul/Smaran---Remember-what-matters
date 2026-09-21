# Smaran — landing page

Marketing site for [Smaran](../), the local-first remembrance app built with Expo.

It lives inside the Expo workspace for now so the design tokens can be kept in
step with the product by hand. It has no dependency on the React Native code and
is designed to be lifted into its own repository unchanged — see
[Moving this out](#moving-this-out).

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Static export by default, zero-config on Vercel |
| Language | TypeScript, `strict` | No `any`, no assertions, explicit return types |
| Styling | Tailwind CSS v4 | Tokens declared with `@theme`, no config file needed |
| Motion | Motion 13 (`motion/react`) | Scroll reveals and the hero sequence |
| Icons | `lucide-react` | Same icon set the app uses (`lucide-react-native`) |

Everything renders as static HTML. There is no database, no API route and no
runtime environment variable.

## Commands

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
npx tsc --noEmit
```

## Design system

Tokens are defined once in [`app/globals.css`](app/globals.css) and mirrored
from the app's `src/constants/theme.ts`. [`lib/theme.ts`](lib/theme.ts) carries
the typed values the live preview needs (accents, corner presets, edge
treatments, typefaces).

Two things deliberately diverge from the product tokens, both for WCAG AA:

- `--ink-muted` is darkened from `#8B8B8B` to `#666666`. The app's value is only
  ~3.3:1 on the paper background at web body sizes.
- `--accent-strong` / `--accent-solid` are darker than the brand sage
  `#7A967A`, which is too light to carry text or white button labels. The brand
  sage is still used for fills, tints, icons and glows, where 3:1 applies.

The page is audited with `axe-core` at **0 violations** (WCAG 2.1 A + AA) on
desktop light, desktop dark and mobile.

### Dark mode

Driven by a `data-theme` attribute on `<html>`, set before first paint by
[`components/ui/ThemeScript.tsx`](components/ui/ThemeScript.tsx) so there is no
theme flash. [`lib/useTheme.ts`](lib/useTheme.ts) reads it through
`useSyncExternalStore`, treating the DOM as the source of truth. It follows the
OS until the visitor makes an explicit choice.

> The storage key lives in its own module, `lib/themeStorage.ts`, with no
> `'use client'` directive. Importing a value from a client module into a server
> component yields a client-reference stub rather than the string, which
> silently corrupts the inlined script.

## Phone mockups

The device screens in [`components/mockup/`](components/mockup) are **HTML
recreations of the app UI**, not screenshots. That is deliberate:

1. The screenshots in the repo root contain a real phone number and a personal
   photo from a notification, so they cannot go on a public page.
2. A recreation stays sharp at any size and needs no asset pipeline.
3. It re-themes live, which is what makes the "Make it yours" section work.

`AppScreen` is themed through scoped `--s-*` custom properties rather than the
page's own utilities, so a dark phone can sit on a light page.

## Before going live

- [ ] Replace the placeholder URLs in `LINKS` ([`lib/content.ts`](lib/content.ts)) with the real store / APK links.
- [ ] Set the real domain in `metadataBase` ([`app/layout.tsx`](app/layout.tsx)).
- [ ] Add an `app/opengraph-image.tsx` (or a static `opengraph-image.png`) for link previews.
- [ ] Confirm the iOS claim in the FAQ still matches the roadmap.

## Moving this out

This folder is self-contained. To extract it:

```bash
git subtree split --prefix=landing-page -b smaran-site
```

Then push that branch to a new repository and import it in Vercel. Nothing needs
to change — the Next.js config already pins `turbopack.root` to this directory,
so it behaves identically nested or standalone.

Once it is gone, drop the `landing-page` entry from the root `metro.config.js`
`blockList`, which only exists to keep Metro from crawling this tree.
