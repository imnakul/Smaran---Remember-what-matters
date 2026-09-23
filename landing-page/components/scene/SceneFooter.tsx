import { BRAND, LINKS } from '@/lib/content';
import { Logo } from '@/components/ui/Logo';
import { Glass } from './Glass';

const FOOTER_LINKS: readonly { readonly href: string; readonly label: string }[] = [
  { href: '#scene-collections', label: 'Collections' },
  { href: '#scene-features', label: 'Features' },
  { href: '#scene-yours', label: 'Make it yours' },
  { href: '#scene-privacy', label: 'Privacy' },
  { href: '#scene-faq', label: 'FAQ' },
] as const;

export function SceneFooter(): React.JSX.Element {
  const year = 2026;

  return (
    /* The extra bottom padding clears the mobile dock, which floats over content. */
    <footer className="relative px-4 pb-32 sm:px-6 lg:px-8 lg:pb-14">
      <Glass className="mx-auto max-w-6xl rounded-round px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <a
              href="#scene-top"
              className="flex items-center gap-2.5"
              aria-label={`${BRAND.name} home`}
            >
              <Logo className="h-6 w-auto" />
              <span className="font-display text-base font-semibold">{BRAND.name}</span>
              <span
                className="font-grotesk rounded-pill bg-white/10 px-2 py-0.5 text-[10px]"
                style={{ color: 'var(--scene-ink-soft)' }}
              >
                v{BRAND.version}
              </span>
            </a>
            <p
              className="mt-3 max-w-sm text-[13px] leading-relaxed"
              style={{ color: 'var(--scene-ink-soft)' }}
            >
              {BRAND.tagline} Built with Expo, kept on your device.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {[...FOOTER_LINKS, { href: LINKS.github, label: 'GitHub' }].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[13px] transition-colors duration-200 hover:text-[var(--scene-ink)]"
                    style={{ color: 'var(--scene-ink-soft)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p
          className="mt-8 border-t border-white/12 pt-5 text-[12px]"
          style={{ color: 'var(--scene-ink-soft)' }}
        >
          &copy; {year} {BRAND.name}. Made in India.
        </p>
      </Glass>
    </footer>
  );
}
