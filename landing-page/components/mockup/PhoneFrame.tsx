import type { ReactNode } from 'react';

/**
 * The chassis material.
 *
 * `silver` follows the page theme, which suits the paper page at `/`.
 * `graphite` is a fixed dark titanium for the scene at `/new`: a bright silver
 * band is the lightest thing on a dimmed photograph and pulls the eye off the
 * screen, where a dark frame recedes and lets the glass be the subject.
 */
export type PhoneFinish = 'silver' | 'graphite';

interface PhoneFrameProps {
  readonly children: ReactNode;
  /** Extra classes for the outer wrapper, typically sizing or transforms. */
  readonly className?: string;
  /**
   * Decorative frames are hidden from assistive tech; the one carrying the
   * primary product story should pass a label instead.
   */
  readonly label?: string;
  readonly finish?: PhoneFinish;
}

const FINISH_CLASSES: Readonly<
  Record<PhoneFinish, { readonly button: string; readonly chassis: string; readonly bezel: string }>
> = {
  silver: {
    button:
      'bg-gradient-to-b from-neutral-400 to-neutral-500 dark:from-neutral-600 dark:to-neutral-700',
    chassis:
      'bg-gradient-to-b from-neutral-300 via-neutral-200 to-neutral-400 shadow-device dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-950',
    bezel: 'bg-neutral-900 dark:bg-black',
  },
  graphite: {
    button: 'bg-gradient-to-b from-[#5b605c] to-[#2b2f2c]',
    // A light catch along the top and left edges, falling off into the body.
    chassis:
      'bg-[linear-gradient(150deg,#8a908b_0%,#3b403c_18%,#1d201e_50%,#2e322f_82%,#6c726d_100%)] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95),0_18px_36px_-18px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]',
    bezel: 'bg-black',
  },
};

/**
 * The device shell around a screen recreation.
 *
 * The frame is drawn rather than imaged so it stays sharp at any size and
 * re-themes with the page. Three layers sell the material: a bevelled outer
 * band for the chassis, a hairline inner ring for the gap between chassis and
 * glass, and a low-opacity diagonal wash for the screen glare.
 */
export function PhoneFrame({
  children,
  className = '',
  label,
  finish = 'silver',
}: PhoneFrameProps): React.JSX.Element {
  const classes = FINISH_CLASSES[finish];

  return (
    <div
      className={`relative w-[min(100%,340px)] ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* Side buttons, drawn behind the chassis so only their edges show. */}
      <span
        aria-hidden
        className={`absolute top-[110px] -left-[3px] h-14 w-[3px] rounded-l-sm ${classes.button}`}
      />
      <span
        aria-hidden
        className={`absolute top-[180px] -left-[3px] h-24 w-[3px] rounded-l-sm ${classes.button}`}
      />
      <span
        aria-hidden
        className={`absolute top-[150px] -right-[3px] h-16 w-[3px] rounded-r-sm ${classes.button}`}
      />

      {/* Chassis */}
      <div className={`relative rounded-[2.75rem] p-[3px] ${classes.chassis}`}>
        <div className={`rounded-[2.65rem] p-[9px] ${classes.bezel}`}>
          {/* Glass */}
          <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] bg-black ring-1 ring-white/[0.06]">
            {children}

            {/* Punch-hole camera */}
            <span
              aria-hidden
              className="absolute top-[10px] left-1/2 z-30 size-[9px] -translate-x-1/2 rounded-full bg-neutral-900 ring-1 ring-white/10"
            />

            {/* Glare: a broad wash plus one narrow diagonal streak, as real cover glass shows. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-white/10 via-transparent to-transparent"
            />
            {finish === 'graphite' ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(115deg,transparent_38%,rgba(255,255,255,0.06)_44%,transparent_52%)]"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
