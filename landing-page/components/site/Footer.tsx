import { BRAND, LINKS, NAV_LINKS } from '@/lib/content';
import { Logo } from '@/components/ui/Logo';

export function Footer(): React.JSX.Element {
  const year = 2026;

  return (
    <footer className="border-t border-line bg-sunken">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <a href="#top" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
            <Logo className="h-6 w-auto" />
            <span className="font-display text-base font-semibold">{BRAND.name}</span>
            <span className="font-grotesk rounded-pill bg-pill px-2 py-0.5 text-[10px] text-muted">
              v{BRAND.version}
            </span>
          </a>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted">
            {BRAND.tagline} Built with Expo, kept on your device.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[13px] text-muted transition-colors duration-200 hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={LINKS.github}
                className="text-[13px] text-muted transition-colors duration-200 hover:text-ink"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[12px] text-muted sm:px-6 lg:px-8">
          &copy; {year} {BRAND.name}. Made in India.
        </p>
      </div>
    </footer>
  );
}
