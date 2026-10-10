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

/** Side-button metal, matching the chassis gradient's darker body. */
const BUTTON_CLASSES = 'bg-gradient-to-b from-[#5b605c] to-[#2b2f2c]';

/**
 * The device shell around a screen recreation.
 *
 * The frame is drawn rather than imaged so it stays sharp at any size. It is
 * a dark graphite titanium: a bright silver band would be the lightest thing
 * on the dimmed photograph and pull the eye off the screen, where a dark frame
 * recedes and lets the glass be the subject. Three layers sell the material:
 * a bevelled outer band for the chassis, a hairline inner ring for the gap
 * between chassis and glass, and a diagonal wash plus one narrow streak for
 * the screen glare.
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
        className={`absolute top-[110px] -left-[3px] h-14 w-[3px] rounded-l-sm ${BUTTON_CLASSES}`}
      />
      <span
        aria-hidden
        className={`absolute top-[180px] -left-[3px] h-24 w-[3px] rounded-l-sm ${BUTTON_CLASSES}`}
      />
      <span
        aria-hidden
        className={`absolute top-[150px] -right-[3px] h-16 w-[3px] rounded-r-sm ${BUTTON_CLASSES}`}
      />

      {/* Chassis: a light catch along the top and left edges, falling off into the body. */}
      <div className="relative rounded-[2.75rem] bg-[linear-gradient(150deg,#8a908b_0%,#3b403c_18%,#1d201e_50%,#2e322f_82%,#6c726d_100%)] p-[3px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95),0_18px_36px_-18px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]">
        <div className="rounded-[2.65rem] bg-black p-[9px]">
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
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(115deg,transparent_38%,rgba(255,255,255,0.06)_44%,transparent_52%)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
