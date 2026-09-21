import {
  Brain,
  BookOpen,
  Sparkles,
  Quote,
  Zap,
  RefreshCw,
  Lock,
  BellRing,
  Share2,
  WifiOff,
  Flame,
  Focus,
  DatabaseBackup,
  Repeat,
  Palette,
  type LucideIcon,
} from 'lucide-react';

/**
 * Marketing copy and product facts for the Smaran landing page.
 *
 * Everything here is derived from what the app actually ships (see the Expo
 * workspace at the repository root). Keeping the copy in one typed module means
 * a capability that changes in the product is a single edit here, and the
 * compiler catches a section that referenced something removed.
 */

/* -------------------------------------------------------------------------- */
/* Brand                                                                       */
/* -------------------------------------------------------------------------- */

export const BRAND = {
  name: 'Smaran',
  /** Devanagari for "remembrance" -- the word the product is named after. */
  devanagari: 'स्मरण',
  tagline: 'Remember what matters, not what is due.',
  version: '1.2.0',
} as const;

/**
 * Outbound links.
 *
 * TODO: Replace the placeholder store and repository URLs before going live.
 * They are intentionally obvious rather than plausible-looking so a forgotten
 * one fails loudly in review instead of shipping as a dead link.
 */
export const LINKS = {
  playStore: '#download',
  apk: '#download',
  github: 'https://github.com/imnakul/remember',
} as const;

/* -------------------------------------------------------------------------- */
/* Collections                                                                 */
/* -------------------------------------------------------------------------- */

export interface Collection {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  /** Sample line shown in the preview card for this collection. */
  readonly sample: string;
}

/** Mirrors `COLLECTIONS` in `src/types/index.ts`. */
export const COLLECTIONS: readonly Collection[] = [
  {
    id: 'remember',
    label: 'Remember',
    description: 'Core thoughts & reminders',
    icon: Brain,
    sample: 'Call Ma before the week runs out.',
  },
  {
    id: 'learnings',
    label: 'Learnings',
    description: 'Daily insights & wisdom',
    icon: BookOpen,
    sample: 'Ship the boring version first.',
  },
  {
    id: 'blessings',
    label: 'Blessings',
    description: 'Gratitude & moments',
    icon: Sparkles,
    sample: 'The chai on the balcony at 6am.',
  },
  {
    id: 'sayings',
    label: 'Sayings',
    description: 'Quotes & mantras',
    icon: Quote,
    sample: 'Simplicity is the prerequisite for reliability.',
  },
  {
    id: 'tryDoing',
    label: 'Try Doing',
    description: 'Experiments & habits',
    icon: Zap,
    sample: 'Walk after dinner. No phone.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Features                                                                    */
/* -------------------------------------------------------------------------- */

export interface Feature {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly icon: LucideIcon;
  /** Controls the bento span. `wide` takes two columns on large screens. */
  readonly span: 'wide' | 'normal';
}

export const FEATURES: readonly Feature[] = [
  {
    id: 'notion',
    title: 'Two-way Notion sync',
    body: 'Point each collection at a Notion database and Smaran keeps both sides honest. Edit on your phone or in Notion; the sync pill tells you exactly where things stand.',
    icon: RefreshCw,
    span: 'wide',
  },
  {
    id: 'offline',
    title: 'Local first, always',
    body: 'Every thought is written to your device first. No account, no server round-trip, no empty screen when the signal drops.',
    icon: WifiOff,
    span: 'normal',
  },
  {
    id: 'lock',
    title: 'PIN lock & screen guard',
    body: 'Gate the app behind a PIN and blank the preview in the app switcher, so a shoulder never reads what you wrote.',
    icon: Lock,
    span: 'normal',
  },
  {
    id: 'repeats',
    title: 'Thoughts that come back',
    body: 'Schedule a thought for a date, or let it repeat. Remembrance is a rhythm, not a one-off notification.',
    icon: Repeat,
    span: 'normal',
  },
  {
    id: 'reminders',
    title: 'One daily nudge',
    body: 'A single reminder at a time you choose. Not a stream of badges competing for the same attention.',
    icon: BellRing,
    span: 'normal',
  },
  {
    id: 'share',
    title: 'Share straight in',
    body: 'Send text from any app into Smaran through the Android share sheet. The good line from a thread lands in the right collection.',
    icon: Share2,
    span: 'normal',
  },
  {
    id: 'streaks',
    title: 'Streaks worth keeping',
    body: 'A ring that fills, a streak that counts, and a small burst of confetti on the days you clear the list.',
    icon: Flame,
    span: 'normal',
  },
  {
    id: 'focus',
    title: 'Focus mode',
    body: 'One thought, full screen, nothing else. For when the list is the distraction.',
    icon: Focus,
    span: 'normal',
  },
  {
    id: 'backup',
    title: 'Your data, exportable',
    body: 'Back up to a file and restore it anywhere. Nothing is held hostage, because nothing was ever taken.',
    icon: DatabaseBackup,
    span: 'normal',
  },
  {
    id: 'theming',
    title: 'Tuned to the last pixel',
    body: 'Seven typefaces, six note colours plus a custom picker, corner radius by the pixel, five edge treatments, four navigation bars, light and dark. Make it yours and it stays yours.',
    icon: Palette,
    span: 'wide',
  },
] as const;

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export const FAQ: readonly FaqItem[] = [
  {
    question: 'Do I need an account?',
    answer:
      'No. Smaran has no sign-up, no login and no server of its own. Thoughts live on your device from the moment you write them.',
  },
  {
    question: 'Where is my data actually stored?',
    answer:
      'On your phone. If you connect Notion, a copy also lives in the Notion databases you chose, under your own Notion account. There is no third place.',
  },
  {
    question: 'Is Notion required?',
    answer:
      'Not at all. Sync is opt-in. Skip it and Smaran is a fully offline app; connect it later and your existing thoughts come along.',
  },
  {
    question: 'Does it work without internet?',
    answer:
      'Yes, completely. Reading, writing, scheduling and completing all work offline. Sync simply waits for a connection and resumes.',
  },
  {
    question: 'Is there an iOS version?',
    answer:
      'Android is available today. The app is built with Expo, so an iOS build is on the roadmap -- note that the Android share sheet integration is Android-only for now.',
  },
  {
    question: 'What does "Smaran" mean?',
    answer:
      'Smaran (स्मरण) is Sanskrit for remembrance -- the act of holding something in mind and returning to it, rather than merely storing it.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Nav                                                                         */
/* -------------------------------------------------------------------------- */

export const NAV_LINKS: readonly { readonly href: string; readonly label: string }[] = [
  { href: '#collections', label: 'Collections' },
  { href: '#features', label: 'Features' },
  { href: '#make-it-yours', label: 'Make it yours' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#faq', label: 'FAQ' },
] as const;
