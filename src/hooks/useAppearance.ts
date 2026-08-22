import { APPEARANCES, AppearanceTokens } from '../constants/appearance';
import { useSettings } from '../context/SettingsContext';
import { CollectionId } from '../types';

/**
 * The design tokens for the currently selected look, optionally resolved
 * for a specific collection dimension or the active collection.
 *
 * Falls back to `soft` if the stored id is not one the app knows.
 */
export function useAppearance(collectionId?: CollectionId): AppearanceTokens {
  const { settings } = useSettings();
  const targetCollection = collectionId ?? settings.activeCollection;
  const collectionAppearance = targetCollection
    ? settings.collectionThemes?.[targetCollection]?.appearance
    : undefined;
  const effectiveId = collectionAppearance ?? settings.appearance;
  return APPEARANCES[effectiveId] ?? APPEARANCES.soft;
}
