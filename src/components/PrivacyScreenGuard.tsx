import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

import { useSettings } from '../context/SettingsContext';

/** Namespaced so nothing else in the app can lift the flag out from under this. */
const CAPTURE_KEY = 'remember-privacy-screen';

/**
 * Applies FLAG_SECURE while the "Hide in app switcher" setting is on.
 *
 * Android has no per-app blur for the recents thumbnail. FLAG_SECURE is the only
 * supported way to keep app content out of it, and it blanks the preview rather
 * than blurring it. The same flag also blocks screenshots and screen recording
 * -- the platform does not separate the two -- which is why this is opt-in and
 * the Settings row spells the tradeoff out.
 *
 * Renders nothing; it exists so the effect lives at the root of the tree and is
 * torn down cleanly if the app is ever unmounted.
 */
export function PrivacyScreenGuard(): null {
  const { settings, isLoaded } = useSettings();
  const enabled = settings.privacyScreen;

  useEffect(() => {
    // Wait for the stored settings, or the app would briefly drop the flag on
    // every cold start while defaults are still in place.
    if (!isLoaded) return;

    if (enabled) {
      ScreenCapture.preventScreenCaptureAsync(CAPTURE_KEY).catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync(CAPTURE_KEY).catch(() => {});
    }

    return () => {
      ScreenCapture.allowScreenCaptureAsync(CAPTURE_KEY).catch(() => {});
    };
  }, [enabled, isLoaded]);

  return null;
}
