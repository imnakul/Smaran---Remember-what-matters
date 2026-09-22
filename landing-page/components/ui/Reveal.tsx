'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface RevealProps {
  readonly children: ReactNode;
  /** Seconds of delay, used to stagger siblings. */
  readonly delay?: number;
  readonly className?: string;
  /** Rendered element. Defaults to a div. */
  readonly as?: 'div' | 'li' | 'section' | 'span';
}

/**
 * Reveals its children once they scroll into view.
 *
 * Motion is treated as an enhancement: when the visitor prefers reduced motion
 * the content renders in its final state immediately rather than animating a
 * shorter distance, because a small movement is still movement.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: RevealProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as];

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
