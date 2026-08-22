import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import { useTypeface } from '../hooks/useTypeface';

interface DayCompleteBannerProps {
  background: string;
  textColor: string;
}

export function DayCompleteBanner({ background, textColor }: DayCompleteBannerProps) {
  const typeface = useTypeface();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 250 });
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[{ backgroundColor: background }, style]}
      className="mx-6 mb-3 px-4 py-3 rounded-2xl flex-row items-center gap-2"
    >
      <CheckCircle2 size={16} color="#7A967A" />
      <Text className={`${typeface.semibold} text-sm`} style={{ color: textColor }}>
        All done for today
      </Text>
    </Animated.View>
  );
}
