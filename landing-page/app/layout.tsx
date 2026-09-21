import type { Metadata, Viewport } from 'next';
import { Lora, Plus_Jakarta_Sans, Caveat, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import { BRAND } from '@/lib/content';
import { ThemeScript } from '@/components/ui/ThemeScript';

import './globals.css';

/*
 * The four faces the app itself ships. `display: swap` keeps first paint
 * readable, and each family is exposed as a CSS variable that `globals.css`
 * maps onto a Tailwind font utility.
 */
const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
});

const DESCRIPTION =
  'Smaran is a calm, local-first Android app for the thoughts you want to keep returning to. Five collections, two-way Notion sync, a PIN lock, and theming down to the corner radius.';

export const metadata: Metadata = {
  // TODO: point this at the real domain once the site is deployed.
  metadataBase: new URL('https://smaran.app'),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND.name,
  keywords: [
    'Smaran',
    'remembrance app',
    'thought journal',
    'Notion sync',
    'local-first',
    'gratitude app',
    'Android',
  ],
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: DESCRIPTION,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFDF9' },
    { media: '(prefers-color-scheme: dark)', color: '#141416' },
  ],
  width: 'device-width',
  initialScale: 1,
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html
      lang="en"
      /*
       * `suppressHydrationWarning` is required and safe here: ThemeScript sets
       * `data-theme` on this element before React hydrates, so the server HTML
       * and the client DOM legitimately differ by that one attribute.
       */
      suppressHydrationWarning
      className={`${lora.variable} ${jakarta.variable} ${caveat.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
