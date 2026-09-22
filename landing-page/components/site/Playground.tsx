'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

import {
  ACCENTS,
  BORDER_OPTIONS,
  CORNER_RADIUS,
  DEFAULT_ACCENT,
  TYPEFACES,
  type AccentOption,
  type CardBorder,
  type TypefaceOption,
} from '@/lib/theme';
import type { ThemedStyle } from '@/lib/styles';
import { AppScreen, type PreviewConfig } from '@/components/mockup/AppScreen';
import { PhoneFrame } from '@/components/mockup/PhoneFrame';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

const DEFAULT_CONFIG: PreviewConfig = {
  accent: DEFAULT_ACCENT,
  cornerRadius: CORNER_RADIUS.round,
  border: 'none',
  typeface: TYPEFACES[0],
  dark: false,
};

/**
 * The live theming playground.
 *
 * This is the section the whole page is built around. Smaran's real
 * differentiator is how far it bends to its owner, and describing that in prose
 * convinces nobody -- so the controls here drive an actual render of the app's
 * home screen, using the same token values the product ships.
 *
 * Every control is a native radio, checkbox or range input behind a styled
 * label, which is what gives the panel full keyboard and screen-reader support
 * without re-implementing roving focus by hand.
 */
export function Playground(): React.JSX.Element {
  const [config, setConfig] = useState<PreviewConfig>(DEFAULT_CONFIG);

  const isDefault =
    config.accent.id === DEFAULT_CONFIG.accent.id &&
    config.cornerRadius === DEFAULT_CONFIG.cornerRadius &&
    config.border === DEFAULT_CONFIG.border &&
    config.typeface.id === DEFAULT_CONFIG.typeface.id &&
    config.dark === DEFAULT_CONFIG.dark;

  const sliderStyle: ThemedStyle = { '--accent': config.accent.accent };

  const setAccent = (accent: AccentOption): void => setConfig((prev) => ({ ...prev, accent }));
  const setBorder = (border: CardBorder): void => setConfig((prev) => ({ ...prev, border }));
  const setTypeface = (typeface: TypefaceOption): void =>
    setConfig((prev) => ({ ...prev, typeface }));

  return (
    <section id="make-it-yours" className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      <div
        aria-hidden
        className="accent-glow pointer-events-none absolute top-1/4 left-[-15%] size-[30rem] opacity-40"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Make it yours"
          title="Most apps offer a dark mode. Smaran offers a dial."
          lede="Seven typefaces, six note colours and a custom picker, corner radius by the pixel, five edge treatments. Change something below — this is the real screen, re-themed live."
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          {/* Controls */}
          <Reveal className="order-2 lg:order-1">
            <div className="rounded-round border border-line bg-raised p-6 shadow-card sm:p-8">
              {/* Note colour */}
              <fieldset>
                <legend className="font-grotesk text-[11px] tracking-[0.18em] text-muted uppercase">
                  Note colour
                </legend>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {ACCENTS.map((accent) => {
                    const isActive = accent.id === config.accent.id;
                    const swatchStyle: ThemedStyle = {
                      background: accent.accent,
                      '--tw-ring-color': accent.accent,
                    };
                    return (
                      <label
                        key={accent.id}
                        className="cursor-pointer"
                        title={accent.label}
                      >
                        <input
                          type="radio"
                          name="accent"
                          value={accent.id}
                          checked={isActive}
                          onChange={() => setAccent(accent)}
                          className="sr-only peer"
                        />
                        <span className="sr-only">{accent.label}</span>
                        <span
                          aria-hidden
                          className={`block size-9 rounded-full transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-accent ${
                            isActive ? 'scale-110 ring-2 ring-offset-2 ring-offset-raised' : 'hover:scale-105'
                          }`}
                          style={swatchStyle}
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Corner radius */}
              <fieldset className="mt-8">
                <legend className="font-grotesk flex w-full items-center justify-between text-[11px] tracking-[0.18em] text-muted uppercase">
                  Corner roundness
                </legend>
                <div className="mt-4 flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    value={config.cornerRadius}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        cornerRadius: Number(event.target.value),
                      }))
                    }
                    aria-label="Card corner radius in pixels"
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-pill accent-[var(--accent)]"
                    style={sliderStyle}
                  />
                  <span className="font-grotesk w-16 shrink-0 text-right text-[13px] tabular-nums text-muted">
                    {config.cornerRadius}px
                  </span>
                </div>
                <p className="mt-2 flex justify-between text-[11px] text-muted">
                  <span>Sharp</span>
                  <span>Pill</span>
                </p>
              </fieldset>

              {/* Edge treatment */}
              <fieldset className="mt-8">
                <legend className="font-grotesk text-[11px] tracking-[0.18em] text-muted uppercase">
                  Card edge
                </legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {BORDER_OPTIONS.map((option) => {
                    const isActive = option.id === config.border;
                    return (
                      <label key={option.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="border"
                          value={option.id}
                          checked={isActive}
                          onChange={() => setBorder(option.id)}
                          className="sr-only peer"
                        />
                        <span
                          className={`block rounded-pill border px-4 py-2 text-[13px] transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                            isActive
                              ? 'border-transparent bg-accent-solid text-accent-on-solid'
                              : 'border-line text-muted hover:border-line-strong hover:text-ink'
                          }`}
                        >
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Typeface */}
              <fieldset className="mt-8">
                <legend className="font-grotesk text-[11px] tracking-[0.18em] text-muted uppercase">
                  Typeface
                </legend>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {TYPEFACES.map((typeface) => {
                    const isActive = typeface.id === config.typeface.id;
                    return (
                      <label key={typeface.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="typeface"
                          value={typeface.id}
                          checked={isActive}
                          onChange={() => setTypeface(typeface)}
                          className="sr-only peer"
                        />
                        <span
                          className={`block rounded-soft border p-3 transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                            isActive
                              ? 'border-accent bg-accent/8'
                              : 'border-line hover:border-line-strong'
                          }`}
                        >
                          <span className={`${typeface.className} block text-[15px]`}>
                            {typeface.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                            {typeface.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Appearance + reset */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.dark}
                    onChange={(event) =>
                      setConfig((prev) => ({ ...prev, dark: event.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <span
                    aria-hidden
                    className="relative h-6 w-11 rounded-full bg-pill transition-colors duration-300 peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-raised after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-5"
                  />
                  <span className="text-[14px]">Dark appearance</span>
                </label>

                <button
                  type="button"
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  disabled={isDefault}
                  className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-[13px] text-muted transition-colors duration-200 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  <RotateCcw className="size-3.5" strokeWidth={1.75} />
                  Reset
                </button>
              </div>
            </div>
          </Reveal>

          {/* Live preview */}
          <Reveal delay={0.1} className="order-1 flex justify-center lg:order-2">
            <div className="lg:sticky lg:top-28">
              <PhoneFrame label="Live preview of the Smaran home screen, reflecting the options selected on this page">
                <AppScreen config={config} lockAccent />
              </PhoneFrame>
              <p className="font-hand mt-5 text-center text-lg text-muted">
                go on &mdash; change something
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
