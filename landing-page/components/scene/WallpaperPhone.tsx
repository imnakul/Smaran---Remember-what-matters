import Image from 'next/image';

import { AppScreen, type PreviewConfig, type PreviewThought } from '@/components/mockup/AppScreen';
import { PhoneFrame } from '@/components/mockup/PhoneFrame';

interface WallpaperPhoneProps {
  readonly config: PreviewConfig;
  readonly thoughts?: readonly PreviewThought[];
  readonly activeTab?: number;
  readonly label?: string;
  readonly className?: string;
  /** Scrim over the in-phone wallpaper, mirroring the app's dim setting. */
  readonly dim?: number;
}

/**
 * The app as it looks with a wallpaper set.
 *
 * The image renders at roughly its native width here, so unlike the page
 * backdrop it stays sharp — which is the point: the blurred scene behind the
 * device and the crisp one inside it read as the same picture at two depths.
 *
 * `dim` mirrors `WALLPAPER_DIM_OPACITY` in the app (light 0.25 / medium 0.5 /
 * strong 0.75); the default sits at the app's medium.
 */
export function WallpaperPhone({
  config,
  thoughts,
  activeTab = 0,
  label,
  className = '',
  dim = 0.5,
}: WallpaperPhoneProps): React.JSX.Element {
  return (
    <PhoneFrame label={label} className={className}>
      <Image
        src="/wallpaper.jpg"
        alt=""
        fill
        sizes="340px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#060a08]" style={{ opacity: dim }} />
      <div className="relative h-full">
        <AppScreen config={config} thoughts={thoughts} activeTab={activeTab} translucent />
      </div>
    </PhoneFrame>
  );
}
