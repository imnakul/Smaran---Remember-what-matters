import type { ReactNode } from 'react';

interface PhoneFrameProps {
  readonly children: ReactNode;
  /** Extra classes for the outer wrapper, typically sizing or transforms. */
  readonly className?: string;
  /**
   * Decorative frames are hidden from assistive tech; the one carrying the
   * primary product story should pass a label instead.
   */
  readonly label?: string;
}

/**
 * The device shell around a screen recreation.
 *
 * The frame is drawn rather than imaged so it stays sharp at any size and
 * re-themes with the page. Three layers sell the material: a bevelled outer
 * band for the chassis, a hairline inner ring for the gap between chassis and
 * glass, and a low-opacity diagonal wash for the screen glare.
 */
export function PhoneFrame({ children, className = '', label }: PhoneFrameProps): React.JSX.Element {
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
        className="absolute top-[110px] -left-[3px] h-14 w-[3px] rounded-l-sm bg-gradient-to-b from-neutral-400 to-neutral-500 dark:from-neutral-600 dark:to-neutral-700"
      />
      <span
        aria-hidden
        className="absolute top-[180px] -left-[3px] h-24 w-[3px] rounded-l-sm bg-gradient-to-b from-neutral-400 to-neutral-500 dark:from-neutral-600 dark:to-neutral-700"
      />
      <span
        aria-hidden
        className="absolute top-[150px] -right-[3px] h-16 w-[3px] rounded-r-sm bg-gradient-to-b from-neutral-400 to-neutral-500 dark:from-neutral-600 dark:to-neutral-700"
      />

      {/* Chassis */}
      <div className="relative rounded-[2.75rem] bg-gradient-to-b from-neutral-300 via-neutral-200 to-neutral-400 p-[3px] shadow-device dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-950">
        <div className="rounded-[2.65rem] bg-neutral-900 p-[9px] dark:bg-black">
          {/* Glass */}
          <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] bg-black">
            {children}

            {/* Punch-hole camera */}
            <span
              aria-hidden
              className="absolute top-[10px] left-1/2 z-30 size-[9px] -translate-x-1/2 rounded-full bg-neutral-900 ring-1 ring-white/10"
            />

            {/* Glare */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-white/10 via-transparent to-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
