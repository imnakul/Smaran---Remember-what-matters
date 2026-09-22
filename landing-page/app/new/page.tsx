import type { Metadata } from 'next';

import { BRAND } from '@/lib/content';
import { SceneBackdrop } from '@/components/scene/SceneBackdrop';
import { SceneCollections } from '@/components/scene/SceneCollections';
import { SceneCta } from '@/components/scene/SceneCta';
import { SceneFaq } from '@/components/scene/SceneFaq';
import { SceneFeatures } from '@/components/scene/SceneFeatures';
import { SceneFooter } from '@/components/scene/SceneFooter';
import { SceneHero } from '@/components/scene/SceneHero';
import { SceneNav } from '@/components/scene/SceneNav';
import { ScenePrivacy } from '@/components/scene/ScenePrivacy';
import { SceneYours } from '@/components/scene/SceneYours';

export const metadata: Metadata = {
  title: 'A quiet place for the thoughts you keep',
  description: `${BRAND.name} on your own wallpaper — frosted cards over a view you chose. Five collections, two-way Notion sync, a PIN lock, and theming down to the corner radius.`,
};

/**
 * The scene variant.
 *
 * A second take on the landing page, built on the app's illustrated wallpaper
 * with frosted panels floating over it. It shares all content and product
 * data with `/`; only the surface treatment differs, so the two cannot drift
 * apart on facts.
 *
 * Everything is scoped under `.scene`, which is where the glass and scrim
 * tokens are defined — `/` renders exactly as it did before this existed.
 */
export default function ScenePage(): React.JSX.Element {
  return (
    <div className="scene relative min-h-dvh">
      <SceneBackdrop />
      <SceneNav />
      <main id="scene-main" className="relative z-10">
        <SceneHero />
        <SceneCollections />
        <SceneFeatures />
        <SceneYours />
        <ScenePrivacy />
        <SceneFaq />
        <SceneCta />
      </main>
      <div className="relative z-10">
        <SceneFooter />
      </div>
    </div>
  );
}
