'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

import type { ThemedStyle } from '@/lib/styles';

/**
 * The single background the whole `/new` page sits on.
 *
 * It is fixed rather than repeated per section, so scrolling reads as moving
 * through one continuous scene instead of past a series of panels that happen
 * to share a texture.
 *
 * Two deliberate treatments:
 *
 * 1. **Soft focus.** The source art is 736x1259, which is fine on a phone but
 *    upscales past 2x on a desktop viewport. Blurring it turns that limit into
 *    the intended effect — the scene is atmosphere, not subject — and it is
 *    what gives the frosted panels something worth refracting. The same image
 *    renders sharp inside the phone mockups, where it is displayed near its
 *    native width.
 * 2. **Scrim.** Type sits over a photograph, so contrast cannot be reasoned
 *    about from the text colour alone. The scrim is weighted so even the
 *    brightest pixel (the sun) composites down to a dark ground first.
 */
export function SceneBackdrop(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // A slow drift, far less than the page scrolls, so the scene feels distant.
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const scrimStyle: ThemedStyle = { opacity: 'var(--scrim)' };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 -top-[8%] h-[120%] will-change-transform"
        style={prefersReducedMotion ? undefined : { y }}
      >
        <Image
          src="/wallpaper.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          // `scale-110` hides the transparent fringe a large blur leaves at the
          // edges of the element.
          className="scale-110 object-cover blur-[3px]"
        />
      </motion.div>

      {/* Base scrim. Opacity is driven by the Day/Dusk control. */}
      <div className="absolute inset-0 bg-[#060a08] transition-opacity duration-700" style={scrimStyle} />

      {/* Vignette, so the corners settle and the centre stays the subject. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(6,10,8,0.55)_100%)]" />

      {/* Grain, matching the texture used on the editorial variant. */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
