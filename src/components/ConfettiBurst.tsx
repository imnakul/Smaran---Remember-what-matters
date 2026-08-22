import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';

const COLORS = ['#7A967A', '#E08A3E', '#5B8DEF', '#D96C6C', '#C9A227'];
const PARTICLE_COUNT = 16;

interface Particle {
  color: string;
  angle: number;
  distance: number;
  delay: number;
  size: number;
}

interface ParticleViewProps extends Particle {}

function ParticleView({ color, angle, distance, delay, size }: ParticleViewProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [progress, delay]);

  const style = useAnimatedStyle(() => {
    const tx = Math.cos(angle) * distance * progress.value;
    const ty = Math.sin(angle) * distance * progress.value + progress.value * progress.value * 50;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${progress.value * 280}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: color,
          left: '50%',
          top: 0,
        },
        style,
      ]}
    />
  );
}

export function ConfettiBurst() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        color: COLORS[i % COLORS.length],
        angle: (Math.PI / (PARTICLE_COUNT - 1)) * i - Math.PI,
        distance: 55 + Math.random() * 45,
        delay: Math.random() * 80,
        size: 6 + Math.random() * 5,
      })),
    []
  );

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 1, alignItems: 'center' }}
    >
      {particles.map((p, i) => (
        <ParticleView key={i} {...p} />
      ))}
    </View>
  );
}
