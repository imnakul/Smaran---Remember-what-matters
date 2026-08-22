import { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { hslToHex } from '../lib/color';

const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360].map(h => hslToHex(h, 1, 0.5));
const THUMB_SIZE = 26;
const HEIGHT = 36;

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

export function HueSlider({ hue, onChange }: HueSliderProps) {
  const [width, setWidth] = useState(0);
  const thumbX = useSharedValue((hue / 360) * width);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    thumbX.value = (hue / 360) * w;
  };

  const updateFromX = (x: number) => {
    if (width <= 0) return;
    const clamped = Math.max(0, Math.min(width, x));
    thumbX.value = clamped;
    onChange((clamped / width) * 360);
  };

  const gesture = Gesture.Pan()
    .onStart(e => runOnJS(updateFromX)(e.x))
    .onUpdate(e => runOnJS(updateFromX)(e.x));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
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
