import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';
import { useTypeface } from '../hooks/useTypeface';
import { NEUTRAL } from '../constants/theme';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueDisplay?: (val: number) => string;
  onChange: (val: number) => void;
  accentColor?: string;
  description?: string;
  leftLabel?: string;
  rightLabel?: string;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  valueDisplay,
  onChange,
  accentColor,
  description,
  leftLabel,
  rightLabel,
}: SliderControlProps): React.JSX.Element {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const accent = accentColor ?? settings.generalThemeColor ?? '#7A967A';

  const trackWidth = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Normalize initial value between 0 and 1
  const clampedVal = Math.min(max, Math.max(min, value));
  const progressRatio = (clampedVal - min) / (max - min || 1);
  const sliderProgress = useSharedValue(progressRatio);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const previousReportedValue = useRef(value);
  useEffect(() => {
    previousReportedValue.current = value;
  }, [value]);

  useEffect(() => {
    if (!isDragging.value) {
      const freshClamped = Math.min(max, Math.max(min, value));
      const freshRatio = (freshClamped - min) / (max - min || 1);
      sliderProgress.value = freshRatio;
    }
  }, [value, min, max, isDragging, sliderProgress]);

  const notifyChange = useCallback((newVal: number): void => {
    const rounded = Number(newVal.toFixed(2));
    if (rounded !== previousReportedValue.current) {
      previousReportedValue.current = rounded;
      Haptics.selectionAsync().catch(() => {});
      onChangeRef.current(rounded);
    }
  }, []);

  const updateFromPosition = (touchX: number): void => {
    'worklet';
    const usableWidth = trackWidth.value - 24;
    if (usableWidth <= 0) return;
    const clampedX = Math.max(0, Math.min(usableWidth, touchX - 12));
    const rawRatio = clampedX / usableWidth;
    const rawValue = min + rawRatio * (max - min);

    // Snap to step
    const stepsCount = Math.round((rawValue - min) / step);
    const steppedValue = Math.min(max, Math.max(min, min + stepsCount * step));
    const steppedRatio = (steppedValue - min) / (max - min || 1);

    sliderProgress.value = steppedRatio;

    runOnJS(notifyChange)(steppedValue);
  };

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-4, 4])
    .failOffsetY([-14, 14])
    .onBegin((e) => {
      isDragging.value = true;
      updateFromPosition(e.x);
    })
    .onUpdate((e) => {
      updateFromPosition(e.x);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, sliderProgress.value * 100))}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const usableWidth = Math.max(0, trackWidth.value - 24);
    const offset = sliderProgress.value * usableWidth;
    return {
      transform: [
        { translateX: Math.max(0, Math.min(usableWidth, offset)) },
        { scale: isDragging.value ? 1.15 : 1 },
      ],
    };
  });

  const displayString = valueDisplay ? valueDisplay(value) : value.toString();

  const handleLayout = (e: LayoutChangeEvent): void => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      trackWidth.value = w;
    }
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1.5 px-0.5">
        <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.text }}>
          {label}
        </Text>
        <View
          className="px-2.5 py-0.5 rounded-full"
          style={{
            backgroundColor: settings.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <Text
            className={`text-xs ${typeface.medium}`}
            style={{ color: accent }}
          >
            {displayString}
          </Text>
        </View>
      </View>

      {description && (
        <Text className={`text-xs ${typeface.regular} mb-2.5 px-0.5`} style={{ color: palette.textMuted }}>
          {description}
        </Text>
      )}

      <GestureDetector gesture={panGesture}>
        <View
          onLayout={handleLayout}
          className="h-10 justify-center relative py-2"
          accessibilityRole="adjustable"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        >
          {/* Base Track */}
          <View
            className="h-2 rounded-full overflow-hidden mx-3"
            style={{
              backgroundColor: settings.darkMode
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Active Fill */}
            <Animated.View
              className="h-full rounded-full"
              style={[
                {
                  backgroundColor: accent,
                },
                fillStyle,
              ]}
            />
          </View>

          {/* Thumb Knob */}
          <Animated.View
            pointerEvents="none"
            className="absolute left-0 w-6 h-6 rounded-full items-center justify-center shadow-md"
            style={[
              {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: accent,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 4,
              },
              thumbStyle,
            ]}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accent }}
            />
          </Animated.View>
        </View>
      </GestureDetector>

      {(leftLabel || rightLabel) && (
        <View className="flex-row items-center justify-between px-1 -mt-0.5">
          <Text className={`text-[11px] ${typeface.regular}`} style={{ color: palette.textMuted }}>
            {leftLabel ?? ''}
          </Text>
          <Text className={`text-[11px] ${typeface.regular}`} style={{ color: palette.textMuted }}>
            {rightLabel ?? ''}
          </Text>
        </View>
      )}
    </View>
  );
}
