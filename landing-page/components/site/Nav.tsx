'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BRAND, LINKS, NAV_LINKS } from '@/lib/content';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/**
 * Sticky site header.
 *
 * The header is transparent over the hero and gains a blurred, bordered plate
 * once the page scrolls, so the hero reads as full-bleed without the nav ever
 * losing contrast against content moving underneath it.
 */
export function Nav(): React.JSX.Element {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = (): void => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile sheet on Escape, and stop the page scrolling behind it.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen
          ? 'border-b border-line bg-paper/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <Logo className="h-7 w-auto" />
          <span className="font-display text-lg font-semibold tracking-tight">{BRAND.name}</span>
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-pill px-3.5 py-2 text-sm text-muted transition-colors duration-200 hover:bg-pill hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={LINKS.playStore}
            className="hidden rounded-pill bg-accent-solid px-5 py-2.5 text-sm font-semibold text-accent-on-solid transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 sm:inline-flex"
          >
            Get Smaran
          </a>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="grid size-10 place-items-center rounded-full border border-line text-ink lg:hidden"
          >
            {isMenuOpen ? (
              <X className="size-[18px]" strokeWidth={1.75} />
            ) : (
              <Menu className="size-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!isMenuOpen}
        className="border-t border-line bg-paper px-4 pb-6 lg:hidden"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-soft px-3 py-3 text-base text-ink transition-colors duration-200 hover:bg-pill"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={LINKS.playStore}
          onClick={() => setIsMenuOpen(false)}
          className="mt-2 flex w-full items-center justify-center rounded-pill bg-accent-solid px-5 py-3.5 text-sm font-semibold text-accent-on-solid"
        >
          Get Smaran
        </a>
      </div>
    </header>
  );
}
