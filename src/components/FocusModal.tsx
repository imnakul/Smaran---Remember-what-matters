import { View, Text, Modal, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Check, ArrowRight, PartyPopper } from 'lucide-react-native';
import { Thought } from '../types';
import { CORNER_RADIUS, NEUTRAL, resolveTheme } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { isThoughtCompletedOnDate } from '../lib/scheduling';
import { useTypeface } from '../hooks/useTypeface';

interface FocusModalProps {
  visible: boolean;
  onClose: () => void;
  thoughts: Thought[];
  selectedDate: Date;
  onToggle: (thought: Thought) => void;
}

const SWIPE_THRESHOLD = 120;

export function FocusModal({ visible, onClose, thoughts, selectedDate, onToggle }: FocusModalProps) {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const radius = CORNER_RADIUS[settings.cardCorner];
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      translateX.value = 0;
    }
  }, [visible, translateX]);

  const current = thoughts[currentIndex];
  const isDone = currentIndex >= thoughts.length;
  const isCompleted = current ? isThoughtCompletedOnDate(current, selectedDate) : false;

  const advance = () => {
    setCurrentIndex(i => i + 1);
    translateX.value = 0;
  };

  const handleComplete = () => {
    if (current && !isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onToggle(current);
    }
    translateX.value = withTiming(500, { duration: 200 }, () => runOnJS(advance)());
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateX.value = withTiming(-500, { duration: 200 }, () => runOnJS(advance)());
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate(e => {
      translateX.value = e.translationX;
    })
    .onEnd(e => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleComplete)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleSkip)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-300, 300], [-12, 12])}deg` },
    ],
    opacity: interpolate(Math.abs(translateX.value), [0, 300], [1, 0.4]),
  }));

  if (!current && !isDone) return null;

  const theme = current ? resolveTheme(current) : undefined;
  const cardBackground = theme
    ? settings.darkMode
      ? theme.darkBackground
      : theme.background
    : palette.surface;
  const cardTextColor = settings.darkMode ? '#F1F1EF' : '#2D2D2D';

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: palette.background }}>
        <View className="flex-row items-center justify-between px-6 pt-2">
          <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.textMuted }}>
            {isDone ? 'Focus mode' : `${currentIndex + 1} / ${thoughts.length}`}
          </Text>
          <Pressable
            onPress={onClose}
            aria-label="Exit focus mode"
            role="button"
            className="p-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color={palette.text} />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          {isDone ? (
            <View className="items-center">
              <PartyPopper size={40} color={palette.text} />
              <Text
                className={`text-xl ${typeface.semibold} mt-4 text-center`}
                style={{ color: palette.text }}
              >
                All caught up
              </Text>
              <Text className={`text-sm ${typeface.regular} mt-2 text-center`} style={{ color: palette.textMuted }}>
                You've reviewed everything for today.
              </Text>
              <Pressable
                onPress={onClose}
                aria-label="Close focus mode"
                role="button"
                className="mt-8 rounded-2xl py-4 px-8"
                style={{ backgroundColor: palette.text }}
              >
                <Text className={`${typeface.semibold} text-base`} style={{ color: palette.background }}>
                  Done
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <GestureDetector gesture={panGesture}>
                <Animated.View
                  style={[
                    {
                      backgroundColor: cardBackground,
                      borderRadius: radius,
                      width: '100%',
                      minHeight: 220,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.15,
                      shadowRadius: 16,
                      elevation: 5,
                    },
                    cardStyle,
                  ]}
                  className="p-8 justify-center"
                >
                  <Text
                    className={`${typeface.medium} text-2xl text-center`}
                    style={{ color: cardTextColor, lineHeight: 34 }}
                  >
                    {current.content}
                  </Text>
                  {isCompleted && (
                    <View className="flex-row items-center justify-center gap-2 mt-6">
                      <Check size={16} color={cardTextColor} />
                      <Text className={`${typeface.medium} text-sm`} style={{ color: cardTextColor }}>
                        Already completed today
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </GestureDetector>

              <Text className={`text-xs ${typeface.regular} mt-6 text-center`} style={{ color: palette.textMuted }}>
                Swipe right to complete, left to skip
              </Text>
            </>
          )}
        </View>

        {!isDone && (
          <View className="flex-row gap-3 px-6" style={{ paddingBottom: insets.bottom + 20 }}>
            <Pressable
              onPress={handleSkip}
              aria-label="Skip this thought"
              role="button"
              className="flex-1 rounded-2xl py-4 items-center justify-center flex-row gap-2"
              style={{ borderWidth: 1, borderColor: palette.border }}
            >
              <ArrowRight size={18} color={palette.textMuted} />
              <Text className={`${typeface.medium} text-base`} style={{ color: palette.textMuted }}>
                Skip
              </Text>
            </Pressable>
            <Pressable
              onPress={handleComplete}
              aria-label="Mark as completed"
              role="button"
              disabled={isCompleted}
              className="flex-1 rounded-2xl py-4 items-center justify-center flex-row gap-2"
              style={{ backgroundColor: palette.text, opacity: isCompleted ? 0.5 : 1 }}
            >
              <Check size={18} color={palette.background} />
              <Text className={`${typeface.semibold} text-base`} style={{ color: palette.background }}>
                Complete
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}
