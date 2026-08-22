import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';

import { useSettings } from '../context/SettingsContext';
import { useAppearance } from '../hooks/useAppearance';
import { NEUTRAL } from '../constants/theme';

interface GlassSurfaceProps {
  children: ReactNode;
  /** Blur strength. Lower reads as frosted glass, higher as heavy diffusion. */
  intensity?: number;
  radius?: number;
  /** Extra layout styles applied to the outer clipping container. */
  style?: ViewStyle;
  className?: string;
}

/**
 * Frosted panel used for the app's floating chrome.
 *
 * Glass only reads as glass when something shows through it, so this pairs the
 * blur with a translucent wash and a bright hairline edge -- the wash keeps
 * text legible over busy content, and the edge catches the boundary that blur
 * alone leaves indistinct.
 *
 * The blur must be clipped by an outer view with its own radius: on Android a
 * BlurView does not reliably respect its own borderRadius.
 *
 * Looks that are not built on glass (Editorial, Mono) set a chrome blur of 0.
 * Those render an opaque panel instead of a frosted one -- a barely-there blur
 * would read as a rendering fault rather than a deliberate flat surface.
 */
export function GlassSurface({
  children,
  intensity = 40,
  radius = 999,
  style,
  className,
}: GlassSurfaceProps) {
  const { settings } = useSettings();
  const appearance = useAppearance();
  const isDark = settings.darkMode;
  const neutral = isDark ? NEUTRAL.dark : NEUTRAL.light;

  // The caller's radius is a request; a look with squared chrome overrides it so
  // every panel in the app agrees on its corners.
  const effectiveRadius = Math.min(radius, appearance.chromeRadius);
  const isFrosted = appearance.chromeBlur > 0;
  // Scale rather than replace, so a caller asking for a subtle blur stays subtle.
  const effectiveIntensity = Math.round((intensity * appearance.chromeBlur) / 40);

  return (
    <View style={[{ borderRadius: effectiveRadius, overflow: 'hidden' }, style]} className={className}>
      {isFrosted && (
        <BlurView
          intensity={effectiveIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: effectiveRadius,
            borderWidth: isFrosted ? StyleSheet.hairlineWidth * 2 : StyleSheet.hairlineWidth,
            borderColor: isFrosted
              ? isDark
                ? 'rgba(255,255,255,0.14)'
                : 'rgba(255,255,255,0.65)'
              : neutral.border,
            backgroundColor: isFrosted
              ? isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.45)'
              : neutral.surface,
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
