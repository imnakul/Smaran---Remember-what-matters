import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

/** Own folder so clearing the wallpaper cannot touch anything else the app stores. */
const WALLPAPER_DIR = 'wallpaper';

function wallpaperDirectory(): Directory {
  return new Directory(Paths.document, WALLPAPER_DIR);
}

/**
 * Removes every stored wallpaper.
 *
 * Called before writing a new one as well as on explicit removal: the filename
 * carries a cache-busting suffix, so without this a user swapping backgrounds
 * repeatedly would quietly accumulate full-resolution images in app storage.
 */
export function clearWallpaper(): void {
  const dir = wallpaperDirectory();
  if (dir.exists) dir.delete();
}

/**
 * Lets the user pick a background image and keeps a private copy of it.
 *
 * The gallery hands back a `content://` URI whose read permission is scoped to
 * this process and is revoked on the next launch, so it cannot be persisted as
 * a setting -- the picked image has to be copied into the app's own storage or
 * the background silently disappears the next time the app opens.
 *
 * @returns the stored file URI, or `null` if the user cancelled.
 */
export async function pickWallpaper(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
    // The system photo picker needs no runtime permission and exposes only the
    // single image the user chose, rather than the whole media library.
    selectionLimit: 1,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const source = new File(result.assets[0].uri);

  clearWallpaper();
  const dir = wallpaperDirectory();
  dir.create({ intermediates: true });

  // A fresh name each time, because `Image` caches aggressively by URI and a
  // reused path would keep showing the previous background.
  const extension = source.extension || '.jpg';
  const destination = new File(dir, `background-${source.size ?? 0}${extension}`);
  source.copy(destination);

  return destination.uri;
}
