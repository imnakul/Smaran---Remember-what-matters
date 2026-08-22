import { View, Text, Modal, Pressable } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { X, Flame } from 'lucide-react-native';
import { format } from 'date-fns';
import { Thought } from '../types';
import { NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';
import { computeStreak, computeHeatmapData } from '../lib/stats';
import { useTypeface } from '../hooks/useTypeface';

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
  thoughts: Thought[];
}

const ACCENT = '#7A967A';

function cellColor(completed: number, total: number, trackColor: string): string {
  if (total === 0) return trackColor;
  const ratio = completed / total;
  if (ratio === 0) return trackColor;
  const opacityHex = Math.round(Math.max(ratio, 0.28) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${ACCENT}${opacityHex}`;
}

export function StatsModal({ visible, onClose, thoughts }: StatsModalProps) {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const { gesture, animatedStyle, overlayStyle } = useSwipeToDismiss(onClose, visible);

  const streak = computeStreak(thoughts);
  const heatmap = computeHeatmapData(thoughts);
  const weeks: typeof heatmap[] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View className="flex-1 justify-end bg-black/20" style={overlayStyle}>
        <Animated.View
          className="rounded-t-[32px] p-6 pb-12 shadow-2xl h-[80%]"
          style={[{ backgroundColor: palette.background }, animatedStyle]}
        >
          <GestureDetector gesture={gesture}>
            <View className="-mx-6 -mt-6 px-6 pt-4 pb-3">
              <View className="items-center mb-4">
                <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: palette.border }} />
              </View>
              <Text className={`text-xl ${typeface.semibold} mb-2`} style={{ color: palette.text }}>
                Streak & History
              </Text>
            </View>
          </GestureDetector>

          <View
            className="rounded-2xl p-6 items-center flex-row justify-center gap-3"
            style={{ backgroundColor: palette.surface }}
          >
            <Flame size={28} color={streak > 0 ? '#E08A3E' : palette.textMuted} />
            <Text className={`text-4xl ${typeface.semibold}`} style={{ color: palette.text }}>
              {streak}
            </Text>
            <Text className={`text-base ${typeface.medium} mt-3`} style={{ color: palette.textMuted }}>
              {streak === 1 ? 'day streak' : 'day streak'}
            </Text>
          </View>

          <Text className={`text-sm ${typeface.medium} mt-8 mb-4 ml-2`} style={{ color: palette.textMuted }}>
            Last 14 weeks
          </Text>

          <View className="flex-row gap-[3px] self-center">
            {weeks.map((week, wi) => (
              <View key={wi} className="gap-[3px]">
                {week.map((day, di) => (
                  <View
                    key={di}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: cellColor(day.completed, day.total, palette.pillMuted),
                    }}
                  />
                ))}
              </View>
            ))}
          </View>

          <Text className={`text-xs ${typeface.regular} mt-4 text-center`} style={{ color: palette.textMuted }}>
            {format(heatmap[0].date, 'MMM d')} – {format(heatmap[heatmap.length - 1].date, 'MMM d')}
          </Text>

          <Pressable
            onPress={onClose}
            aria-label="Close stats"
            role="button"
            className="absolute bottom-6 right-6 w-12 h-12 rounded-full items-center justify-center shadow-lg"
            style={{
              backgroundColor: palette.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <X size={22} color={palette.text} />
          </Pressable>
        </Animated.View>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
