import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Brain, BookOpen, Sparkles, Quote, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { CollectionId, COLLECTIONS, Thought } from '../types';
import { NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useTypeface } from '../hooks/useTypeface';
import { getScheduledThoughtsForDate } from '../lib/scheduling';

interface CollectionTabsProps {
  activeCollection: CollectionId;
  onSelectCollection: (id: CollectionId) => void;
  thoughts?: Thought[];
  selectedDate?: Date;
}

const ICONS = {
  remember: Brain,
  learnings: BookOpen,
  blessings: Sparkles,
  sayings: Quote,
  tryDoing: Zap,
};

const ACCENT_COLOR = '#7A967A';
const ACCENT_DARK = '#8FA88F';

export function CollectionTabs({
  activeCollection,
  onSelectCollection,
  thoughts = [],
  selectedDate,
}: CollectionTabsProps) {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const scrollViewRef = useRef<ScrollView>(null);

  const activeColor = settings.darkMode ? ACCENT_DARK : ACCENT_COLOR;

  // Auto scroll to active tab
  useEffect(() => {
    const index = COLLECTIONS.findIndex(c => c.id === activeCollection);
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: Math.max(0, index * 105 - 30),
        animated: true,
      });
    }
  }, [activeCollection]);

  return (
    <View className="py-2">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        role="tablist"
      >
        {COLLECTIONS.map((item) => {
          const isActive = activeCollection === item.id;
          const IconComponent = ICONS[item.id];

          // Compute count of scheduled items for this collection today
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
              aria-label={`${item.label} tab, ${count} items`}
              className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border"
              style={[
                {
                  backgroundColor: isActive
                    ? settings.darkMode
                      ? 'rgba(143, 168, 143, 0.22)'
                      : 'rgba(122, 150, 122, 0.16)'
                    : settings.darkMode
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isActive
                    ? settings.darkMode
                      ? 'rgba(143, 168, 143, 0.45)'
                      : 'rgba(122, 150, 122, 0.35)'
                    : 'transparent',
                },
              ]}
            >
              <IconComponent
                size={14}
                color={isActive ? activeColor : palette.textMuted}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              <Text
                className={`text-xs ${isActive ? typeface.semibold : typeface.medium}`}
                style={{
                  color: isActive ? (settings.darkMode ? '#E1EBE1' : '#3E5C3E') : palette.textMuted,
                }}
              >
                {item.label}
              </Text>
              {count > 0 && (
                <View
                  className="rounded-full px-1.5 py-0.5 min-w-[18px] items-center justify-center ml-0.5"
                  style={{
                    backgroundColor: isActive
                      ? settings.darkMode
                        ? 'rgba(143, 168, 143, 0.35)'
                        : 'rgba(122, 150, 122, 0.28)'
                      : settings.darkMode
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <Text
                    className={`text-[10px] ${isActive ? typeface.semibold : typeface.regular}`}
                    style={{
                      color: isActive ? (settings.darkMode ? '#FFFFFF' : '#2D442D') : palette.textMuted,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
