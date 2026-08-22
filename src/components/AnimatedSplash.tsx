import { View, Text, Image, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { useTypeface } from '../hooks/useTypeface';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** Must match `expo-splash-screen`'s backgroundColor in app.json, or the handoff blinks. */
const SPLASH_BACKGROUND = '#FDFDF9';

/** Must match `imageWidth` in app.json for the same reason. */
const LOGO_SIZE = 160;

const ACCENT = '#7A967A';

/** How long the entrance plays before the overlay starts clearing. */
const ENTRANCE_MS = 900;

const EXIT_FADE_MS = 380;
const EXIT_SCALE_MS = 420;

interface AnimatedSplashProps {
  /** Called once the overlay has fully faded, so the parent can unmount it. */
  onFinish: () => void;
}

/**
 * Bridges the native splash screen into the app with a single continuous motion.
 *
 * The native splash cannot animate, so it is hidden the instant this mounts and
 * this takes over painting the exact same logo on the exact same background --
 * the swap is invisible, and what the user sees is one uninterrupted beat: the
 * mark dips, springs back, the wordmark rises under it, then the whole plate
 * scales up and dissolves into the app behind it.
 *
 * Any drift in LOGO_SIZE or SPLASH_BACKGROUND from the app.json values will show
 * up as a visible jump at the handoff, so those two constants are load-bearing.
 */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const typeface = useTypeface();
  const reduceMotion = useReducedMotion();

  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const labelOpacity = useSharedValue(0);
  const labelShift = useSharedValue(12);

  // Read the callback through a ref so the sequence below runs exactly once and
  // is not restarted by a parent re-render handing down a fresh closure.
  const finishRef = useRef(onFinish);
  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const done = (finished?: boolean): void => {
      if (finished) runOnJS(finishRef.current)();
    };

    // Someone who has asked the system to reduce motion gets the handoff without
    // the bounce -- a plain dissolve, still seamless, just not springy.
    if (reduceMotion) {
      opacity.value = withDelay(240, withTiming(0, { duration: 240 }, done));
      return;
    }

    logoScale.value = withSequence(
      withTiming(0.88, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 8, stiffness: 150, mass: 0.6 })
    );
    labelOpacity.value = withDelay(280, withTiming(1, { duration: 320 }));
    labelShift.value = withDelay(280, withSpring(0, { damping: 16, stiffness: 160 }));

    // The exit is fired from a timer rather than appended to the sequence above:
    // a spring settles in a variable amount of time, so chaining would let the
    // scale-up and the fade start on different frames and read as two motions.
    const id = setTimeout(() => {
      logoScale.value = withTiming(1.4, {
        duration: EXIT_SCALE_MS,
        easing: Easing.in(Easing.cubic),
      });
      labelOpacity.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(
        0,
        { duration: EXIT_FADE_MS, easing: Easing.in(Easing.quad) },
        done
      );
    }, ENTRANCE_MS);

    const safetyId = setTimeout(() => {
      finishRef.current();
    }, ENTRANCE_MS + EXIT_FADE_MS + 120);

    return () => {
      clearTimeout(id);
      clearTimeout(safetyId);
    };
  }, [reduceMotion, opacity, logoScale, labelOpacity, labelShift]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelShift.value }],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: SPLASH_BACKGROUND },
        containerStyle,
      ]}
      className="items-center justify-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={logoStyle}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={labelStyle} className="absolute bottom-0 items-center pb-24">
        <Text className={`text-base ${typeface.semibold} tracking-[3px]`} style={{ color: ACCENT }}>
          REMEMBER
        </Text>
        <View className="h-px w-10 mt-3" style={{ backgroundColor: ACCENT, opacity: 0.35 }} />
      </Animated.View>
    </Animated.View>
  );
}
