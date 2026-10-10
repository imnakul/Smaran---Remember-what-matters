'use client';

import { useEffect } from 'react';

/** The class a pane opts in with. Defined in `globals.css`. */
const INTERACTIVE_SELECTOR = '.glass-interactive';

/**
 * Feeds the pointer position to whichever frosted pane is under it.
 *
 * One delegated listener for the whole page rather than a handler per card:
 * panes opt in with a class and need no wiring, and there is only ever one
 * listener however many there are. Writes are batched to one per frame, and
 * only the pane under the pointer is touched, so moving the mouse never
 * restyles the rest of the page.
 *
 * Touch and pen input are ignored -- there is no hover on a phone, and a glow
 * that appears wherever a finger lands reads as a rendering fault.
 */
export function PointerGlow(): null {
  useEffect(() => {
    let frame = 0;
    let pending: { readonly pane: HTMLElement; readonly x: number; readonly y: number } | null = null;

    const flush = (): void => {
      frame = 0;
      if (!pending) return;
      pending.pane.style.setProperty('--mx', `${pending.x}px`);
      pending.pane.style.setProperty('--my', `${pending.y}px`);
      pending = null;
    };

    const handleMove = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return;

      const pane = event.target.closest(INTERACTIVE_SELECTOR);
      if (!(pane instanceof HTMLElement)) return;

      const rect = pane.getBoundingClientRect();
      pending = { pane, x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (frame === 0) frame = requestAnimationFrame(flush);
    };

    document.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', handleMove);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
