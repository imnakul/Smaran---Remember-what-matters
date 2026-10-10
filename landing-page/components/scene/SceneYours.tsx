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
import type { PreviewConfig } from '@/components/mockup/AppScreen';
import { Reveal } from '@/components/ui/Reveal';
import { Glass } from './Glass';
import { SceneHeading } from './SceneHeading';
import { WallpaperPhone } from './WallpaperPhone';

interface SceneSettings {
  readonly accent: AccentOption;
  readonly cornerRadius: number;
  readonly border: CardBorder;
  readonly typeface: TypefaceOption;
  /** Scrim over the wallpaper. Mirrors the app's `WALLPAPER_DIM_OPACITY`. */
  readonly dim: number;
}

const DEFAULT_SETTINGS: SceneSettings = {
  accent: DEFAULT_ACCENT,
  cornerRadius: CORNER_RADIUS.round,
  border: 'none',
  typeface: TYPEFACES[0],
  dim: 0.5,
};

/** The app's three named dim levels, used to label the slider's position. */
function dimLabel(value: number): string {
  if (value <= 0.375) return 'Light';
  if (value <= 0.625) return 'Medium';
  return 'Strong';
}

/**
 * The live theming playground, scene edition.
 *
 * Same idea as the editorial page's, with the control the wallpaper makes
 * relevant: how heavily the background is dimmed behind the cards. Every value
 * here is one the app actually ships.
 */
export function SceneYours(): React.JSX.Element {
  const [settings, setSettings] = useState<SceneSettings>(DEFAULT_SETTINGS);

  const isDefault =
    settings.accent.id === DEFAULT_SETTINGS.accent.id &&
    settings.cornerRadius === DEFAULT_SETTINGS.cornerRadius &&
    settings.border === DEFAULT_SETTINGS.border &&
    settings.typeface.id === DEFAULT_SETTINGS.typeface.id &&
    settings.dim === DEFAULT_SETTINGS.dim;

  const previewConfig: PreviewConfig = {
    accent: settings.accent,
    cornerRadius: settings.cornerRadius,
    border: settings.border,
    typeface: settings.typeface,
    dark: true,
  };

  /** Feeds a range input its accent and how far along its track it sits. */
  const rangeStyle = (value: number, min: number, max: number): ThemedStyle => ({
    '--accent': settings.accent.accent,
    '--fill': `${((value - min) / (max - min)) * 100}%`,
  });

  return (
    <section id="scene-yours" className="relative py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SceneHeading
          eyebrow="Make it yours"
          title="Most apps offer a dark mode. Smaran offers a dial."
          lede="Your wallpaper, your colours, your corners, your type. Change something below — this is the real screen, over the real background, re-themed live."
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <Glass tone="strong" className="glass-interactive rounded-round p-6 sm:p-8">
              {/* Note colour */}
              <fieldset>
                <legend
                  className="font-grotesk text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: 'var(--scene-ink-muted)' }}
                >
                  Note colour
                </legend>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {ACCENTS.map((accent) => {
                    const isActive = accent.id === settings.accent.id;
                    const swatchStyle: ThemedStyle = {
                      background: accent.accent,
                      '--tw-ring-color': accent.accent,
                    };
                    return (
                      <label key={accent.id} className="cursor-pointer" title={accent.label}>
                        <input
                          type="radio"
                          name="scene-accent"
                          value={accent.id}
                          checked={isActive}
                          onChange={() => setSettings((prev) => ({ ...prev, accent }))}
                          className="peer sr-only"
                        />
                        <span className="sr-only">{accent.label}</span>
                        <span
                          aria-hidden
                          className={`block size-9 rounded-full transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[var(--scene-accent)] ${
                            isActive
                              ? 'scale-110 ring-2 ring-offset-2 ring-offset-[#131a15]'
                              : 'hover:scale-105'
                          }`}
                          style={swatchStyle}
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Wallpaper dim -- the control the background makes relevant. */}
              <fieldset className="mt-8">
                <legend
                  className="font-grotesk text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: 'var(--scene-ink-muted)' }}
                >
                  Wallpaper dim
                </legend>
                <div className="mt-4 flex items-center gap-4">
                  <input
                    type="range"
                    min={0.25}
                    max={0.75}
                    step={0.05}
                    value={settings.dim}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, dim: Number(event.target.value) }))
                    }
                    aria-label="Wallpaper dim strength"
                    aria-valuetext={`${dimLabel(settings.dim)}, ${Math.round(settings.dim * 100)} percent`}
                    className="scene-range w-full"
                    style={rangeStyle(settings.dim, 0.25, 0.75)}
                  />
                  <span
                    className="font-grotesk w-20 shrink-0 text-right text-[13px] tabular-nums"
                    style={{ color: 'var(--scene-ink-muted)' }}
                  >
                    {dimLabel(settings.dim)}
                  </span>
                </div>
              </fieldset>

              {/* Corner radius */}
              <fieldset className="mt-8">
                <legend
                  className="font-grotesk text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: 'var(--scene-ink-muted)' }}
                >
                  Corner roundness
                </legend>
                <div className="mt-4 flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    value={settings.cornerRadius}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, cornerRadius: Number(event.target.value) }))
                    }
                    aria-label="Card corner radius in pixels"
                    className="scene-range w-full"
                    style={rangeStyle(settings.cornerRadius, 0, 32)}
                  />
                  <span
                    className="font-grotesk w-20 shrink-0 text-right text-[13px] tabular-nums"
                    style={{ color: 'var(--scene-ink-muted)' }}
                  >
                    {settings.cornerRadius}px
                  </span>
                </div>
              </fieldset>

              {/* Edge treatment */}
              <fieldset className="mt-8">
                <legend
                  className="font-grotesk text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: 'var(--scene-ink-muted)' }}
                >
                  Card edge
                </legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {BORDER_OPTIONS.map((option) => {
                    const isActive = option.id === settings.border;
                    return (
                      <label key={option.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="scene-border"
                          value={option.id}
                          checked={isActive}
                          onChange={() => setSettings((prev) => ({ ...prev, border: option.id }))}
                          className="peer sr-only"
                        />
                        <span
                          className={`block rounded-pill border px-4 py-2 text-[13px] transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--scene-accent)] ${
                            isActive
                              ? 'border-transparent bg-[var(--scene-ink)] text-[#0d1410] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_-10px_rgba(0,0,0,0.9)]'
                              : 'border-white/20 text-[var(--scene-ink-soft)] hover:border-white/40 hover:text-[var(--scene-ink)]'
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
                <legend
                  className="font-grotesk text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: 'var(--scene-ink-muted)' }}
                >
                  Typeface
                </legend>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {TYPEFACES.map((typeface) => {
                    const isActive = typeface.id === settings.typeface.id;
                    return (
                      <label key={typeface.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="scene-typeface"
                          value={typeface.id}
                          checked={isActive}
                          onChange={() => setSettings((prev) => ({ ...prev, typeface }))}
                          className="peer sr-only"
                        />
                        <span
                          className={`block rounded-soft border p-3 transition-all duration-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--scene-accent)] ${
                            isActive
                              ? 'border-[var(--scene-accent)] bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_3px_color-mix(in_oklab,var(--scene-accent)_18%,transparent)]'
                              : 'border-white/15 hover:border-white/30'
                          }`}
                        >
                          <span className={`${typeface.className} block text-[15px]`}>
                            {typeface.label}
                          </span>
                          <span
                            className="mt-0.5 block text-[11px] leading-snug"
                            style={{ color: 'var(--scene-ink-muted)' }}
                          >
                            {typeface.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-8 flex justify-end border-t border-white/12 pt-6">
                <button
                  type="button"
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                  disabled={isDefault}
                  className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-[13px] transition-colors duration-200 hover:text-[var(--scene-ink)] disabled:pointer-events-none disabled:opacity-40"
                  style={{ color: 'var(--scene-ink-muted)' }}
                >
                  <RotateCcw className="size-3.5" strokeWidth={1.75} />
                  Reset
                </button>
              </div>
            </Glass>
          </Reveal>

          <Reveal delay={0.1} className="order-1 flex justify-center lg:order-2">
            <div className="lg:sticky lg:top-28">
              <WallpaperPhone
                config={previewConfig}
                dim={settings.dim}
                lockAccent
                label="Live preview of the Smaran home screen over a wallpaper, reflecting the options selected on this page"
              />
              <p
                className="font-hand mt-5 text-center text-lg"
                style={{ color: 'var(--scene-ink-soft)' }}
              >
                go on &mdash; change something
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
