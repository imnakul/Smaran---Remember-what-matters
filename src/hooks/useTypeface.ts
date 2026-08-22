import { TYPEFACES, TypefaceClasses } from '../constants/fonts';
import { useSettings } from '../context/SettingsContext';
import { CollectionId } from '../types';

/**
 * Tailwind font classes for the user's chosen typeface, optionally resolved
 * for a specific collection dimension or the active collection.
 *
 * Falls back to Inter when the stored id is unknown.
 */
export function useTypeface(collectionId?: CollectionId): TypefaceClasses {
  const { settings } = useSettings();
  const targetCollection = collectionId ?? settings.activeCollection;
  const collectionFont = targetCollection
    ? settings.collectionThemes?.[targetCollection]?.fontFamily
    : undefined;
  const effectiveFont = collectionFont ?? settings.fontFamily;
  return (TYPEFACES[effectiveFont] ?? TYPEFACES.inter).classes;
}
