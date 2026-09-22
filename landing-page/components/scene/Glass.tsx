import type { ElementType, ReactNode } from 'react';

interface GlassProps {
  readonly children: ReactNode;
  /**
   * `strong` trades some refraction for legibility. Use it for panels carrying
   * paragraphs; `default` suits chrome and short labels.
   */
  readonly tone?: 'default' | 'strong';
  readonly className?: string;
  readonly as?: ElementType;
}

/**
 * A frosted pane.
 *
 * The visual recipe lives in `globals.css` under `.glass` / `.glass-strong` so
 * the blur, wash, hairline and inner highlight stay in step everywhere, and so
 * a single `@supports` fallback covers every pane at once.
 */
export function Glass({
  children,
  tone = 'default',
  className = '',
  as: Tag = 'div',
}: GlassProps): React.JSX.Element {
  return (
    <Tag className={`${tone === 'strong' ? 'glass-strong' : 'glass'} ${className}`}>{children}</Tag>
  );
}
