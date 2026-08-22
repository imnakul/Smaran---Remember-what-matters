import { Text, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { format, addDays, subDays, isSameDay, isToday, isAfter } from 'date-fns';
import { useEffect, useMemo, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';
import { useAppearance } from '../hooks/useAppearance';
import { NEUTRAL } from '../constants/theme';
import { useTypeface } from '../hooks/useTypeface';

interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

interface DatePillProps {
  date: Date;
  isSelected: boolean;
  onPress: () => void;
  darkMode: boolean;
  /** Pill corner radius, taken from the active look. */
  radius: number;
  /** Blur strength behind the selected pill. 0 renders it as a solid chip. */
  blur: number;
  /** Compact looks shrink the pill so more of the screen goes to the list. */
  dense: boolean;
  /** +1 when the window moved forward in time, -1 backward. Sets the roll direction. */
  direction: number;
  /** Slot position, used to stagger the roll across the row. */
  index: number;
}

/** How far the numbers travel as they roll in, in px. */
const ROLL_DISTANCE = 20;
/** Per-slot delay, so the row rolls as a wave rather than snapping as one block. */
const ROLL_STAGGER_MS = 26;

function DatePill({ date, isSelected, onPress, darkMode, radius, blur, dense, direction, index }: DatePillProps) {
  const typeface = useTypeface();
  const scale = useSharedValue(isSelected ? 1 : 0.86);
  const contentOpacity = useSharedValue(1);
  const contentShift = useSharedValue(0);
  const dayKey = date.toISOString();

  useEffect(() => {
    scale.value = withTiming(isSelected ? 1 : 0.86, {
      duration: 180,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isSelected, scale]);

  /**
   * The row itself never translates -- the dates change underneath it. To keep
   * that legible rather than abrupt, each slot's numbers roll in from the side
   * the new date arrived from, staggered across the row so the change reads as
   * one sweep instead of seven simultaneous swaps.
   *
   * Keyed on the ISO day so a re-render that does not change the date (a theme
   * switch, a selection change) never retriggers the roll.
   */
  useEffect(() => {
    if (direction === 0) return;
    const delay = index * ROLL_STAGGER_MS;

    contentShift.value = direction * ROLL_DISTANCE;
    contentOpacity.value = 0;

    contentShift.value = withDelay(
      delay,
      withTiming(0, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    contentOpacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    // `direction` is read at the moment the day changes and must not retrigger
    // this on its own, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, index, contentShift, contentOpacity]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rollStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentShift.value }],
  }));

  // A solid chip inverts its label; a frosted one keeps the ambient text colour.
  const selectedTextColor =
    blur === 0
      ? darkMode
        ? NEUTRAL.dark.background
        : NEUTRAL.light.background
      : darkMode
      ? '#F1F1EF'
      : '#2D2D2D';

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={format(date, 'EEEE d MMMM')}
      aria-selected={isSelected}
      className="items-center justify-center"
    >
      <Animated.View
        style={[scaleStyle, { borderRadius: radius }]}
        className={`items-center justify-center overflow-hidden ${dense ? 'w-11 h-12' : 'w-14 h-16'}`}
      >
        {isSelected && blur > 0 && (
          <BlurView
            intensity={blur}
            tint={darkMode ? 'dark' : 'light'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(45,45,45,0.28)',
            }}
          />
        )}
        {isSelected && blur === 0 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: radius,
              backgroundColor: darkMode ? NEUTRAL.dark.text : NEUTRAL.light.text,
            }}
          />
        )}
        <Animated.View style={rollStyle} className="items-center justify-center">
          <Text
            style={{ color: isSelected ? selectedTextColor : '#8B8B8B' }}
            className={`text-xs ${typeface.medium}`}
          >
            {format(date, 'EEE')}
          </Text>
          <Text
            className={`${typeface.semibold} mt-1 ${dense ? 'text-base' : 'text-lg'}`}
            style={{ color: isSelected ? selectedTextColor : darkMode ? '#F1F1EF' : '#2D2D2D' }}
          >
            {format(date, 'd')}
          </Text>
          {isToday(date) && !isSelected && (
            <View className="w-1 h-1 rounded-full bg-[#8B8B8B] mt-1" />
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** Days rendered either side of the selection. */
const WINDOW_RADIUS = 3;

export function DateStrip({ selectedDate, onSelectDate }: DateStripProps) {
  const { settings } = useSettings();
  const appearance = useAppearance();
  // 999 is the "fully rounded" sentinel; a pill that tall would look like a bar.
  const pillRadius = Math.min(appearance.chromeRadius, 16);
  const isDense = appearance.id === 'compact';

  /**
   * The row deliberately does not translate. The window re-centres on the
   * selection, so each pill keeps its slot and only its numbers roll -- the
   * strip stays put and the dates change underneath it.
   */
  const dates = useMemo(() => {
    const list: Date[] = [];
    for (let i = -WINDOW_RADIUS; i <= WINDOW_RADIUS; i++) {
      list.push(i > 0 ? addDays(selectedDate, i) : subDays(selectedDate, Math.abs(i)));
    }
    return list;
  }, [selectedDate]);

  /**
   * Which way the window last moved, so the numbers roll in from the side the
   * new dates came from. A ref rather than state: it is read during the render
   * that follows the change and must never cause one of its own.
   */
  const previousDate = useRef(selectedDate);
  let direction = 0;
  if (!isSameDay(previousDate.current, selectedDate)) {
    direction = isAfter(selectedDate, previousDate.current) ? 1 : -1;
    previousDate.current = selectedDate;
  }

  const jumpDays = (count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDate(count > 0 ? addDays(selectedDate, count) : subDays(selectedDate, Math.abs(count)));
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onEnd(e => {
      if (Math.abs(e.translationX) < 40) return;

      const direction = e.translationX < 0 ? 1 : -1;
      const speed = Math.abs(e.velocityX);
      // Fast flicks jump multiple days; a slow drag moves just one.
      const days = speed > 1400 ? 4 : speed > 800 ? 2 : 1;
      runOnJS(jumpDays)(direction * days);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View className={`w-full flex-row items-center justify-between px-4 ${isDense ? 'py-2' : 'py-4'}`}>
        {dates.map((date, index) => (
          <DatePill
            // Keyed by slot, not by date: remounting on every change would throw
            // away the animation state the roll depends on.
            key={index}
            date={date}
            direction={direction}
            index={direction < 0 ? dates.length - 1 - index : index}
            isSelected={isSameDay(date, selectedDate)}
            onPress={() => onSelectDate(date)}
            darkMode={settings.darkMode}
            radius={pillRadius}
            blur={appearance.chromeBlur > 0 ? 45 : 0}
            dense={isDense}
          />
        ))}
      </View>
    </GestureDetector>
  );
}
