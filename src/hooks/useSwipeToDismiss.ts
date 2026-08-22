import { useCallback, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

/**
 * How far a sheet travels to leave the screen.
 *
 * Read from the window rather than hard-coded, because a fixed 600 leaves a
 * tall sheet on a tall device still partly visible when it is meant to be gone.
 */
const TRAVEL = Dimensions.get('window').height;

interface SwipeToDismissOptions {
  /**
   * Slide the sheet up on open instead of appearing in place.
   *
   * Sheets inside a native `Modal` get that motion from the window itself, so
   * they leave this off. A sheet living in the normal view tree has no window
   * animation and has to provide its own.
   */
  animateIn?: boolean;
}

export function useSwipeToDismiss(
  onClose: () => void,
  isOpen: boolean,
  { animateIn = false }: SwipeToDismissOptions = {}
) {
  const translateY = useSharedValue(0);

  /**
   * A sheet that stays mounted across opens keeps the offset its last dismissal
   * left behind, so every open has to restate the position rather than assume
   * it. Without this the sheet reappears parked off the bottom of the screen,
   * showing only the strip of itself that still overlaps the viewport.
   */
  useEffect(() => {
    if (!isOpen) return;
    if (animateIn) {
      translateY.value = TRAVEL;
      translateY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
    } else {
      translateY.value = 0;
    }
  }, [isOpen, animateIn, translateY]);

  const gesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        translateY.value = withTiming(TRAVEL, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 220, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      }
    });

  /**
   * Closes the sheet with the same motion as a completed swipe.
   *
   * Callers that dismiss from a button rather than a gesture use this so the
   * sheet always leaves the same way. It matters most for sheets that are not
   * native Modals, which have no window animation of their own to fall back on.
   */
  const dismiss = useCallback(() => {
    translateY.value = withTiming(TRAVEL, { duration: 200 }, finished => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, TRAVEL], [1, 0], Extrapolation.CLAMP),
  }));

  return { gesture, animatedStyle, overlayStyle, dismiss };
}
