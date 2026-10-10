'use client';

import { Brain, HelpCircle, Lock, Palette, Sparkles, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BRAND, LINKS } from '@/lib/content';
import { Logo } from '@/components/ui/Logo';
import { Glass } from './Glass';

interface SceneLink {
  readonly id: string;
  readonly label: string;
  /** Shorter form for the five-up mobile dock, where the full label wraps. */
  readonly short: string;
  readonly icon: LucideIcon;
}

/** Five destinations, deliberately — the dock mirrors the app's five tabs. */
const SCENE_LINKS: readonly SceneLink[] = [
  { id: 'scene-collections', label: 'Collections', short: 'Collect', icon: Brain },
  { id: 'scene-features', label: 'Features', short: 'Features', icon: Sparkles },
  { id: 'scene-yours', label: 'Make it yours', short: 'Theme', icon: Palette },
  { id: 'scene-privacy', label: 'Privacy', short: 'Privacy', icon: Lock },
  { id: 'scene-faq', label: 'FAQ', short: 'FAQ', icon: HelpCircle },
] as const;

/**
 * Tracks which section currently occupies the middle of the viewport.
 *
 * The dock highlights it the way the app highlights the collection you are
 * looking at, so the navigation reports position rather than only offering
 * destinations. The root margin collapses the observation area to a band
 * across the middle of the screen, which is what stops two adjacent sections
 * from both counting as visible.
 */
function useActiveSection(ids: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        setActiveId(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

export function SceneNav(): React.JSX.Element {
  const activeId = useActiveSection(SCENE_LINKS.map((link) => link.id));

  return (
    <>
      {/* Top bar: brand, links from lg, controls. */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <Glass className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-pill px-3 sm:h-16 sm:px-4">
          <a
            href="#scene-top"
            className="flex shrink-0 items-center gap-2.5 pl-1"
            aria-label={`${BRAND.name} home`}
          >
            <Logo className="h-6 w-auto" />
            <span className="font-display text-base font-semibold">{BRAND.name}</span>
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {SCENE_LINKS.map((link) => {
                const isActive = link.id === activeId;
                return (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      aria-current={isActive ? 'true' : undefined}
                      className={`rounded-pill px-3.5 py-2 text-[13px] transition-colors duration-300 ${
                        isActive
                          ? 'bg-white/15 text-[var(--scene-ink)]'
                          : 'text-[var(--scene-ink-soft)] hover:bg-white/10 hover:text-[var(--scene-ink)]'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center">
            <a
              href={LINKS.playStore}
              className="rounded-pill bg-[var(--scene-ink)] px-4 py-2 text-[13px] font-semibold text-[#0d1410] transition-transform duration-300 hover:-translate-y-0.5 sm:px-5"
            >
              Get {BRAND.name}
            </a>
          </div>
        </Glass>
      </header>

      {/*
        Mobile dock. Bottom-anchored and thumb-reachable, styled after the
        app's own tab bar -- the site navigates the way the product does.
      */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <Glass className="mx-auto flex max-w-md items-stretch justify-around rounded-[1.75rem] p-1.5">
          {SCENE_LINKS.map((link) => {
            const isActive = link.id === activeId;
            const Icon = link.icon;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 rounded-[1.25rem] px-1 py-2 transition-colors duration-300 ${
                  isActive ? 'bg-white/15' : ''
                }`}
              >
                <Icon
                  aria-hidden
                  className="size-[18px]"
                  strokeWidth={isActive ? 2.1 : 1.6}
                  style={{ color: isActive ? 'var(--scene-accent)' : 'var(--scene-ink-soft)' }}
                />
                <span
                  className="text-[9px] leading-none font-medium"
                  style={{ color: isActive ? 'var(--scene-accent)' : 'var(--scene-ink-soft)' }}
                >
                  {link.short}
                </span>
                {/* The dock shows an abbreviation; assistive tech gets the real name. */}
                <span className="sr-only">{link.label}</span>
              </a>
            );
          })}
        </Glass>
      </nav>
    </>
  );
}
