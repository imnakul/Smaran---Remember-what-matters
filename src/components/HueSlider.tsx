import { useEffect, useRef, useCallback, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { hslToHex } from '../lib/color';

const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360].map(h => hslToHex(h, 1, 0.5));
const THUMB_SIZE = 26;
const HEIGHT = 36;

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

export function HueSlider({ hue, onChange }: HueSliderProps): React.JSX.Element {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthVal = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const thumbX = useSharedValue(0);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const lastReportedHue = useRef(hue);
  useEffect(() => {
    lastReportedHue.current = hue;
  }, [hue]);

  useEffect(() => {
    if (!isDragging.value && trackWidth > 0) {
      thumbX.value = (Math.max(0, Math.min(360, hue)) / 360) * trackWidth;
    }
  }, [hue, trackWidth, isDragging, thumbX]);

  const handleLayout = (e: LayoutChangeEvent): void => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setTrackWidth(w);
      trackWidthVal.value = w;
      thumbX.value = (Math.max(0, Math.min(360, hue)) / 360) * w;
    }
  };

  const notifyChange = useCallback((newHue: number): void => {
    const rounded = Math.round(newHue);
    if (rounded !== lastReportedHue.current) {
      lastReportedHue.current = rounded;
      Haptics.selectionAsync().catch(() => {});
      onChangeRef.current(rounded);
    }
  }, []);

  const updateFromPosition = (touchX: number): void => {
    'worklet';
    if (trackWidthVal.value <= 0) return;
    const clamped = Math.max(0, Math.min(trackWidthVal.value, touchX));
    thumbX.value = clamped;
    const computedHue = (clamped / trackWidthVal.value) * 360;
    runOnJS(notifyChange)(computedHue);
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-4, 4])
    .failOffsetY([-14, 14])
    .onBegin(e => {
      isDragging.value = true;
      updateFromPosition(e.x);
    })
    .onUpdate(e => {
      updateFromPosition(e.x);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - THUMB_SIZE / 2 },
      { scale: isDragging.value ? 1.15 : 1 },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View onLayout={handleLayout} style={{ height: HEIGHT, justifyContent: 'center' }}>
        <Svg width="100%" height={HEIGHT - 12} style={{ borderRadius: (HEIGHT - 12) / 2 }}>
          <Defs>
            <LinearGradient id="hueGradient" x1="0" y1="0" x2="1" y2="0">
              {HUE_STOPS.map((color, i) => (
                <Stop key={i} offset={i / (HUE_STOPS.length - 1)} stopColor={color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={(HEIGHT - 12) / 2} fill="url(#hueGradient)" />
        </Svg>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: '#FFFFFF',
              borderWidth: 3,
              borderColor: hslToHex(hue, 1, 0.5),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.25,
              shadowRadius: 3,
              elevation: 3,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
