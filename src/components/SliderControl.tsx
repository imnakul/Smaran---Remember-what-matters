import React, { useRef } from 'react';
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
}: SliderControlProps) {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const accent = accentColor ?? settings.generalThemeColor ?? '#7A967A';

  const trackWidth = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const previousReportedValue = useRef(value);

  // Normalize initial value between 0 and 1
  const clampedVal = Math.min(max, Math.max(min, value));
  const progressRatio = (clampedVal - min) / (max - min || 1);
  const sliderProgress = useSharedValue(progressRatio);

  React.useEffect(() => {
    const freshRatio = (Math.min(max, Math.max(min, value)) - min) / (max - min || 1);
    sliderProgress.value = freshRatio;
  }, [value, min, max, sliderProgress]);

  const updateFromPosition = (touchX: number) => {
    'worklet';
    if (trackWidth.value <= 0) return;
    const rawRatio = Math.max(0, Math.min(1, touchX / trackWidth.value));
    const rawValue = min + rawRatio * (max - min);
    
    // Snap to step
    const stepsCount = Math.round((rawValue - min) / step);
    const steppedValue = Math.min(max, Math.max(min, min + stepsCount * step));
    const steppedRatio = (steppedValue - min) / (max - min || 1);
    
    sliderProgress.value = steppedRatio;

    runOnJS(notifyChange)(steppedValue);
  };

  const notifyChange = (newVal: number) => {
    const rounded = Number(newVal.toFixed(2));
    if (rounded !== previousReportedValue.current) {
      previousReportedValue.current = rounded;
      Haptics.selectionAsync();
      onChange(rounded);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-15, 15])
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

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      updateFromPosition(e.x);
    });

  const gesture = Gesture.Race(panGesture, tapGesture);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, sliderProgress.value * 100))}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const offset = sliderProgress.value * trackWidth.value;
    return {
      transform: [
        { translateX: Math.max(0, Math.min(trackWidth.value, offset)) - 12 },
        { scale: isDragging.value ? 1.15 : 1 },
      ],
    };
  });

  const displayString = valueDisplay ? valueDisplay(value) : value.toString();

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidth.value = e.nativeEvent.layout.width;
  };

  const handleTouch = (locationX: number) => {
    if (trackWidth.value <= 0) return;
    const rawRatio = Math.max(0, Math.min(1, locationX / trackWidth.value));
    const rawValue = min + rawRatio * (max - min);
    const stepsCount = Math.round((rawValue - min) / step);
    const steppedValue = Math.min(max, Math.max(min, min + stepsCount * step));
    const steppedRatio = (steppedValue - min) / (max - min || 1);
    sliderProgress.value = steppedRatio;
    notifyChange(steppedValue);
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1.5">
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
        <Text className={`text-xs ${typeface.regular} mb-2.5`} style={{ color: palette.textMuted }}>
          {description}
        </Text>
      )}

      <GestureDetector gesture={gesture}>
        <View
          onLayout={handleLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            isDragging.value = true;
            handleTouch(e.nativeEvent.locationX);
          }}
          onResponderMove={(e) => {
            handleTouch(e.nativeEvent.locationX);
          }}
          onResponderRelease={() => {
            isDragging.value = false;
          }}
          onResponderTerminate={() => {
            isDragging.value = false;
          }}
          className="h-10 justify-center relative py-2"
          accessibilityRole="adjustable"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        >
          {/* Base Track */}
          <View
            className="h-2 rounded-full overflow-hidden"
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
            className="absolute w-6 h-6 rounded-full items-center justify-center shadow-md"
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
        <View className="flex-row items-center justify-between -mt-1">
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
