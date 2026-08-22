import { View, Text, Pressable } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useTypeface } from '../hooks/useTypeface';

interface UndoSnackbarProps {
  /** Message to show, or null to hide the bar. */
  message: string | null;
  onUndo: () => void;
  onDismiss: () => void;
}

/** How long the undo stays available before the action becomes final. */
const VISIBLE_MS = 5000;

/**
 * Transient bar offering to reverse the last destructive action.
 *
 * This is what lets swipe-to-delete skip a confirmation dialog: the delete
 * happens immediately and stays reversible for a few seconds, which is faster
 * to use and easier to recover from than a modal asking "are you sure".
 */
export function UndoSnackbar({ message, onUndo, onDismiss }: UndoSnackbarProps) {
  const typeface = useTypeface();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

  // Read the callback through a ref so the timer below depends only on the
  // message. Depending on the callback itself would restart the countdown on
  // every parent render, and it might then never fire at all.
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  // Restart the countdown whenever a new message arrives, so a second delete
  // does not inherit the remainder of the first one's window.
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => dismissRef.current(), VISIBLE_MS);
    return () => clearTimeout(id);
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown.duration(200)}
      className="absolute left-4 right-4"
      style={{ bottom: insets.bottom + 100 }}
      pointerEvents="box-none"
    >
      <View
        accessibilityLiveRegion="polite"
        className="flex-row items-center justify-between rounded-2xl px-4 py-3.5"
        style={{
          backgroundColor: settings.darkMode ? NEUTRAL.dark.surface : '#2D2D2D',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Text
          numberOfLines={1}
          className={`flex-1 mr-3 text-sm ${typeface.regular}`}
          style={{ color: NEUTRAL.dark.text }}
        >
          {message}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onUndo();
          }}
          role="button"
          aria-label="Undo delete"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className={`text-sm ${typeface.semibold}`} style={{ color: '#8FAD8F' }}>
            Undo
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
