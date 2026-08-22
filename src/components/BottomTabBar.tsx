import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { Brain, BookOpen, Sparkles, Quote, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { CollectionId, COLLECTIONS, Thought } from '../types';
import { NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useTypeface } from '../hooks/useTypeface';
import { getScheduledThoughtsForDate } from '../lib/scheduling';

interface BottomTabBarProps {
  activeCollection: CollectionId;
  onSelectCollection: (id: CollectionId) => void;
  thoughts?: Thought[];
  selectedDate?: Date;
  bottomInset?: number;
}

const ICONS = {
  remember: Brain,
  learnings: BookOpen,
  blessings: Sparkles,
  sayings: Quote,
  tryDoing: Zap,
};

export function BottomTabBar({
  activeCollection,
  onSelectCollection,
  thoughts = [],
  selectedDate,
  bottomInset = 0,
}: BottomTabBarProps) {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const accent = settings.generalThemeColor ?? '#7A967A';

  const [containerWidth, setContainerWidth] = useState(0);

  const orderedCollections = (settings.collectionOrder && settings.collectionOrder.length === COLLECTIONS.length)
    ? settings.collectionOrder.map(id => COLLECTIONS.find(c => c.id === id)!).filter(Boolean)
    : COLLECTIONS;

  const activeIndex = Math.max(
    0,
    orderedCollections.findIndex(c => c.id === activeCollection)
  );

  const tabWidth = containerWidth > 0 ? (containerWidth - 16) / orderedCollections.length : 0;

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withTiming(activeIndex * tabWidth, {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [activeIndex, tabWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => {
    if (tabWidth === 0) return { opacity: 0 };
    return {
      width: tabWidth,
      transform: [{ translateX: translateX.value }],
      opacity: 1,
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
      translateX.value = activeIndex * ((w - 16) / COLLECTIONS.length);
    }
  };

  const activeColor = accent;

  return (
    <View
      style={{
        backgroundColor: settings.darkMode ? '#18181B' : '#F7F7F2',
        borderTopWidth: 1,
        borderColor: settings.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        paddingBottom: Math.max(bottomInset, 10),
      }}
      className="px-2 pt-1.5"
    >
      <View
        onLayout={onLayout}
        className="flex-row items-center relative py-1"
        role="tablist"
      >
        {/* Smooth Sliding Background Indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 2,
                bottom: 2,
                left: 8,
                borderRadius: 14,
                backgroundColor: settings.darkMode
                  ? 'rgba(255, 255, 255, 0.09)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderWidth: 1.5,
                borderColor: accent,
              },
              indicatorStyle,
            ]}
          />
        )}

        {orderedCollections.map((item) => {
          const isActive = activeCollection === item.id;
          const IconComponent = ICONS[item.id];

          // Compute count of scheduled items for this collection on the selected date
          const count = selectedDate
            ? getScheduledThoughtsForDate(
                thoughts.filter(t => (t.collection ?? 'remember') === item.id),
                selectedDate
              ).length
            : thoughts.filter(t => (t.collection ?? 'remember') === item.id).length;

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (!isActive) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectCollection(item.id);
                }
              }}
              role="tab"
              aria-selected={isActive}
              aria-label={`${item.label} tab, ${count} scheduled`}
              className="flex-1 items-center justify-center py-1.5 px-0.5 relative z-10"
            >
              <View className="items-center justify-center relative">
                <IconComponent
                  size={18}
                  color={isActive ? activeColor : palette.textMuted}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {count > 0 && (
                  <View
                    className="absolute -top-1.5 -right-3 rounded-full min-w-[15px] h-[15px] px-1 items-center justify-center"
                    style={{
                      backgroundColor: isActive
                        ? accent
                        : settings.darkMode
                        ? 'rgba(255, 255, 255, 0.18)'
                        : 'rgba(0, 0, 0, 0.14)',
                    }}
                  >
                    <Text
                      className={`text-[9px] ${typeface.semibold}`}
                      style={{
                        color: isActive
                          ? settings.darkMode
                            ? '#121C12'
                            : '#FFFFFF'
                          : palette.textMuted,
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                numberOfLines={1}
                className={`text-[10px] mt-1 ${isActive ? typeface.semibold : typeface.medium}`}
                style={{
                  color: isActive
                    ? settings.darkMode
                      ? '#E1EBE1'
                      : '#324732'
                    : palette.textMuted,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
