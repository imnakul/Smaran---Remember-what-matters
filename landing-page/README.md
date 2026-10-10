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

### Brand mark

`public/logo.png` is the app's own icon, derived from `assets/icon.png` in the
Expo workspace with its solid black plate matted out to alpha — so one file
works on the light paper page, on dark, and on the scene's frosted panels
without a box around it. `app/icon.png` (the favicon) comes from the same
artwork at 512px, since the repo's `assets/favicon.png` is only 48px.

Size the mark with a height and an automatic width (`h-7 w-auto`). It is
slightly taller than it is wide, so a square utility such as `size-7` squashes
it.

### Paired buttons

Both hero and closing calls to action share `CTA_BASE` from
[`lib/styles.ts`](lib/styles.ts). It omits the border on purpose: every variant
supplies its own 1px one (`border border-transparent` on a filled button),
because a border participates in the box and a button without one renders 2px
shorter than the outlined or frosted button beside it.

## The page

"Through the window" — cinematic, frosted glass over the app's own
illustrated wallpaper, which is how the product looks once an owner sets a
background. Everything specific to it is scoped under a `.scene` class.

> An earlier editorial "quiet paper" design lived at `/` with a light/dark
> toggle. It was retired when this one replaced it; `/new`, where this design
> was previewed, now redirects permanently to `/` (see `next.config.ts`). Both
> are in git history.

- **One continuous background.** The wallpaper is fixed rather than repeated per
  section, so scrolling reads as moving through a single scene. It drifts at a
  fraction of the scroll speed to sit back in depth.
- **Two images, both sharp.** `public/scene.jpg` (1672x941 landscape) is the
  page backdrop and renders at roughly native scale on common viewports;
  `public/wallpaper.jpg` (736x1259 portrait) is the app's own background inside
  the phone mockups, where it displays near its native width. The backdrop is
  deliberately *not* blurred — leaving it crisp is what sells the frosted
  panels, because then the only blurred thing on screen is what you are looking
  *through*.
- **No theme toggle.** The type is light on a photograph either way, so a
  light/dark switch had nothing to flip. The scene uses one fixed scrim
  (`--scrim: 0.48`), inside the 0.44–0.56 band the contrast was verified
  across.
- **A dock, not a header.** On mobile the navigation is a floating glass dock at
  thumb height with five destinations, mirroring the app's five collection tabs.
  An `IntersectionObserver` highlights the section you are actually in, so it
  reports position rather than only offering destinations.
- **The playground gains a wallpaper dim slider**, the control the background
  makes relevant. Its range is the app's real 0.25–0.75.

- **Glass, not grey boxes.** Every pane layers blur, a wash with baked-in
  grain, and a *graded* edge ring (`::before`, bright at the top-left bevel,
  fading along the sides). Panes with `.glass-interactive` also follow the
  mouse: one delegated listener in `PointerGlow` writes `--mx` / `--my`, which
  lights the edge in the accent and casts a soft spot across the face. Touch
  input is ignored.
- **Frosted notes inside the phone.** With `translucent` set, `AppScreen`
  draws each thought as a glass card (accent tint over a dark wash, top
  highlight, a bloom of the note's colour), with a floating glass tab dock and
  date strip. `PhoneFrame` is a dark graphite chassis, and `WallpaperPhone`
  casts an accent glow onto the scene.
- **Hero widgets.** A reminder, a Notion sync pill and the streak float off
  the device as separate glass panes (`HeroWidgets`). Decorative and
  `aria-hidden`; hidden on phones, and only the sync pill shows at `lg`.

#### Contrast over a photograph

Type on an image cannot be checked from its colour alone, so the scene is built
so the ground is deterministic before any type is drawn:

- The scrim is weighted so even the brightest pixel (the sun) composites down to
  a dark ground first.
- Content panels use `.glass-strong`; chrome uses the lighter `.glass` with a
  brighter secondary ink (`--scene-ink-soft`), because the thinner wash leaves
  `--scene-ink-muted` just under 4.5:1.
- Hero copy sits on its own gradient (`.text-scrim`), since it is on the scene
  rather than on a pane.
- `.scene` carries an **opaque dark base**. That is the fallback if the image
  404s or is still loading — without it the panes composite against the
  document's paper-white body and the light type becomes unreadable.

axe-core reported **0 violations** on this design at both ends of the scrim band (0.44 and 0.56) and on mobile.
It marks 47 nodes *indeterminate* rather than passing them, because it cannot
compute the luminance of a background image; those were verified by hand
against the worst-case (brightest) pixel.

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
- [ ] **Clear the rights to `public/scene.jpg` and `public/wallpaper.jpg`.**
      Using an image as your own phone wallpaper is not the same as publishing
      it on a public marketing site. Swap both for art you own or have licensed
      before launch — the code takes whatever sits at those two paths.
- [ ] Re-run the axe-core audit now that the glass design is the only page.

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
