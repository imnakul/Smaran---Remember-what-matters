import { View, Text, Pressable } from 'react-native';
import { useEffect } from 'react';
import { Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTypeface } from '../hooks/useTypeface';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface PinPadProps {
  /** Digits entered so far. */
  value: string;
  onChange: (next: string) => void;
  /** Entry is submitted automatically once this many digits are present. */
  length: number;
  /** Bumped by the parent to trigger the error shake; any new value replays it. */
  shakeToken?: number;
  disabled?: boolean;
  palette: { text: string; textMuted: string; pillMuted: string; border: string };
  accent: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/**
 * Numeric keypad with a filled-dot progress row.
 *
 * Submission is implicit: the parent watches `value` and acts once it reaches
 * `length`, which keeps the pad itself stateless.
 */
export function PinPad({ value, onChange, length, shakeToken, disabled = false, palette, accent }: PinPadProps) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (shakeToken === undefined) return;
    shakeX.value = withSequence(
      withTiming(-11, { duration: 55 }),
      withTiming(11, { duration: 55 }),
      withTiming(-7, { duration: 50 }),
      withTiming(7, { duration: 50 }),
      withTiming(0, { duration: 45 })
    );
  }, [shakeToken, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const press = (key: string) => {
    if (disabled) return;
    if (key === 'del') {
      if (value.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value + key);
  };

  return (
    <View className="items-center w-full">
      <Animated.View className="flex-row gap-4 mb-12" style={shakeStyle}>
        {Array.from({ length }).map((_, i) => (
          <Dot key={i} filled={i < value.length} accent={accent} border={palette.border} />
        ))}
      </Animated.View>

      <View className="flex-row flex-wrap justify-center" style={{ maxWidth: 300 }}>
        {KEYS.map((key, i) =>
          key === '' ? (
            <View key={`spacer-${i}`} className="w-[88px] h-[88px]" />
          ) : (
            <Key
              key={key}
              label={key}
              disabled={disabled}
              onPress={() => press(key)}
              palette={palette}
            />
          )
        )}
      </View>
    </View>
  );
}

function Dot({ filled, accent, border }: { filled: boolean; accent: string; border: string }) {
  const scale = useSharedValue(filled ? 1 : 0.55);

  useEffect(() => {
    scale.value = withSpring(filled ? 1 : 0.55, { damping: 13, stiffness: 320 });
  }, [filled, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: 15,
          height: 15,
          borderRadius: 999,
          backgroundColor: filled ? accent : 'transparent',
          borderWidth: filled ? 0 : 1.5,
          borderColor: border,
        },
      ]}
    />
  );
}

function Key({
  label,
  onPress,
  disabled,
  palette,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  palette: { text: string; textMuted: string; pillMuted: string };
}) {
  const typeface = useTypeface();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDelete = label === 'del';

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 500 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 380 });
      }}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      aria-label={isDelete ? 'Delete last digit' : `Digit ${label}`}
      className="w-[88px] h-[88px] items-center justify-center"
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        className="w-[68px] h-[68px] rounded-full items-center justify-center"
        style={[style, { backgroundColor: isDelete ? 'transparent' : palette.pillMuted }]}
      >
        {isDelete ? (
          <Delete size={24} color={palette.textMuted} />
        ) : (
          <Text className={`text-[26px] ${typeface.medium}`} style={{ color: palette.text }}>
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
