import { SceneBackdrop } from '@/components/scene/SceneBackdrop';
import { SceneCollections } from '@/components/scene/SceneCollections';
import { SceneCta } from '@/components/scene/SceneCta';
import { SceneFaq } from '@/components/scene/SceneFaq';
import { SceneFeatures } from '@/components/scene/SceneFeatures';
import { SceneFooter } from '@/components/scene/SceneFooter';
import { SceneHero } from '@/components/scene/SceneHero';
import { PointerGlow } from '@/components/scene/PointerGlow';
import { SceneNav } from '@/components/scene/SceneNav';
import { ScenePrivacy } from '@/components/scene/ScenePrivacy';
import { SceneYours } from '@/components/scene/SceneYours';

/**
 * The landing page.
 *
 * Built on the app's illustrated wallpaper with frosted panels floating over
 * it, so the page looks the way the product does once an owner sets their own
 * background. Everything is scoped under `.scene`, which is where the glass
 * and scrim tokens are defined.
 */
export default function HomePage(): React.JSX.Element {
  return (
    <div className="scene relative min-h-dvh overflow-x-clip">
      <SceneBackdrop />
      <PointerGlow />
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
