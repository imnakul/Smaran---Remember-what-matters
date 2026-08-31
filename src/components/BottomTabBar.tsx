import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Brain, BookOpen, Quote, Sparkles, Zap } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import Animated, {
  cancelAnimation,
  interpolate,
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useSettings } from '../context/SettingsContext';
import { useTypeface } from '../hooks/useTypeface';
import { COLLECTIONS, type CollectionId, type CollectionMeta, type NavigationStyle } from '../types';
import { NEUTRAL } from '../constants/theme';

export interface BottomTabBarProps {
  activeCollection: CollectionId;
  onSelectCollection: (id: CollectionId) => void;
  bottomInset?: number;
  navigationStyle?: NavigationStyle;
}

const ICONS = {
  remember: Brain,
  learnings: BookOpen,
  blessings: Sparkles,
  sayings: Quote,
  tryDoing: Zap,
} satisfies Record<CollectionId, typeof Brain>;

const SPRING_CONFIG = {
  damping: 22,
  mass: 0.65,
  stiffness: 240,
  overshootClamping: false,
} as const;

function getOrderedCollections(order: CollectionId[] | undefined): CollectionMeta[] {
  if (!order || order.length !== COLLECTIONS.length || new Set(order).size !== COLLECTIONS.length) {
    return [...COLLECTIONS];
  }

  const ordered = order.flatMap((id) => {
    const collection = COLLECTIONS.find((item) => item.id === id);
    return collection ? [collection] : [];
  });

  return ordered.length === COLLECTIONS.length ? ordered : [...COLLECTIONS];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==========================================
// 1. CAROUSEL ARC (Physical Rotating Arc Dial)
// ==========================================

const CAROUSEL_BAR_HEIGHT = 68;
const CAROUSEL_SELECTOR_HEADROOM = 38;
const CAROUSEL_ARC_DEPTH = 22;
const CAROUSEL_SELECTOR_RADIUS = 29;
const CAROUSEL_SELECTOR_TOP = 12;
const CAROUSEL_TAB_TOUCH_SIZE = 58;
const CAROUSEL_STATIC_ICON_SIZE = 42;

function wrappedDistance(index: number, progress: number, count: number): number {
  'worklet';
  const half = count / 2;
  const rawDistance = index - progress;
  return ((rawDistance + half) % count + count) % count - half;
}

function nearestEquivalentIndex(index: number, current: number, count: number): number {
  'worklet';
  return index + Math.round((current - index) / count) * count;
}

function CarouselArcTab({
  collection,
  index,
  isActive,
  progress,
  collectionCount,
  carouselSpacing,
  centerX,
  accent,
  inactiveIconColor,
  inactiveSurfaceColor,
  inactiveBorderColor,
  onPress,
}: {
  collection: CollectionMeta;
  index: number;
  isActive: boolean;
  progress: SharedValue<number>;
  collectionCount: number;
  carouselSpacing: number;
  centerX: number;
  accent: string;
  inactiveIconColor: string;
  inactiveSurfaceColor: string;
  inactiveBorderColor: string;
  onPress: () => void;
}): React.JSX.Element {
  const Icon = ICONS[collection.id];
  const animatedTabStyle = useAnimatedStyle(() => {
    const position = wrappedDistance(index, progress.value, collectionCount);
    const distance = Math.abs(position);
    const arcOffset = CAROUSEL_ARC_DEPTH * (distance / 2) ** 2;

    return {
      opacity: interpolate(distance, [0, 1.7, 2.5], [1, 0.82, 0.28], 'clamp'),
      transform: [
        { translateX: centerX + position * carouselSpacing - CAROUSEL_TAB_TOUCH_SIZE / 2 },
        { translateY: CAROUSEL_SELECTOR_TOP + arcOffset },
        { scale: interpolate(distance, [0, 1, 2.5], [1, 0.88, 0.72], 'clamp') },
      ],
      zIndex: Math.round(20 - distance * 4),
    };
  }, [carouselSpacing, centerX, collectionCount, index]);

  const iconSurfaceStyle = useAnimatedStyle(() => {
    const distance = Math.abs(wrappedDistance(index, progress.value, collectionCount));

    return {
      backgroundColor: interpolateColor(
        distance,
        [0, 0.65],
        ['rgba(250,250,247,0)', inactiveSurfaceColor],
      ),
      borderColor: interpolateColor(
        distance,
        [0, 0.65],
        ['rgba(20,20,22,0)', inactiveBorderColor],
      ),
    };
  }, [collectionCount, inactiveBorderColor, inactiveSurfaceColor, index]);

  const selectedIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(wrappedDistance(index, progress.value, collectionCount)),
      [0, 0.58],
      [1, 0],
      'clamp',
    ),
  }), [collectionCount, index]);

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(wrappedDistance(index, progress.value, collectionCount)),
      [0, 0.58],
      [0, 1],
      'clamp',
    ),
  }), [collectionCount, index]);

  return (
    <AnimatedPressable
      accessibilityLabel={`${collection.label} tab`}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      role="tab"
      aria-label={`${collection.label} tab`}
      aria-selected={isActive}
      style={[
        {
          alignItems: 'center',
          height: CAROUSEL_TAB_TOUCH_SIZE,
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          top: 0,
          width: CAROUSEL_TAB_TOUCH_SIZE,
        },
        animatedTabStyle,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            alignItems: 'center',
            borderRadius: CAROUSEL_STATIC_ICON_SIZE / 2,
            borderWidth: 1,
            height: CAROUSEL_STATIC_ICON_SIZE,
            justifyContent: 'center',
            width: CAROUSEL_STATIC_ICON_SIZE,
          },
          iconSurfaceStyle,
        ]}
      >
        <Animated.View style={[{ position: 'absolute' }, selectedIconStyle]}>
          <Icon color={accent} size={23} strokeWidth={2.2} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute' }, inactiveIconStyle]}>
          <Icon color={inactiveIconColor} size={20} strokeWidth={1.9} />
        </Animated.View>
      </Animated.View>
    </AnimatedPressable>
  );
}

function CarouselArcBar({
  orderedCollections,
  activeCollection,
  activeIndex,
  onSelectIndex,
  bottomInset,
  accent,
  isDark,
}: {
  orderedCollections: CollectionMeta[];
  activeCollection: CollectionId;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  bottomInset: number;
  accent: string;
  isDark: boolean;
}): React.JSX.Element {
  const typeface = useTypeface(activeCollection);
  const [width, setWidth] = useState(0);
  const collectionCount = orderedCollections.length;
  const carouselSpacing = width > 0 ? Math.min(72, (width - 40) / 4) : 0;
  const centerX = width / 2;
  const activeMeta = orderedCollections[activeIndex] ?? COLLECTIONS[0];

  const inactiveIconColor = isDark ? '#F5F5F2' : '#55575C';
  const inactiveSurfaceColor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(45,46,50,0.10)';
  const inactiveBorderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(45,46,50,0.08)';

  const progress = useSharedValue(activeIndex);
  const dragStartProgress = useSharedValue(activeIndex);

  useEffect(() => {
    const target = nearestEquivalentIndex(activeIndex, progress.value, collectionCount);
    progress.value = withSpring(target, SPRING_CONFIG);
  }, [activeIndex, collectionCount, progress]);

  const panGesture = Gesture.Pan()
    .enabled(carouselSpacing > 0)
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      cancelAnimation(progress);
      dragStartProgress.value = progress.value;
    })
    .onUpdate((event) => {
      progress.value = dragStartProgress.value - event.translationX / carouselSpacing;
    })
    .onEnd((event) => {
      const velocityInTabs = event.velocityX / carouselSpacing;
      const projectedProgress = progress.value - velocityInTabs * 0.15;
      const targetIndex = Math.round(projectedProgress);

      progress.value = withSpring(targetIndex, SPRING_CONFIG);
      runOnJS(onSelectIndex)(targetIndex);
    })
    .onFinalize((_event, success) => {
      if (!success) {
        const target = nearestEquivalentIndex(activeIndex, progress.value, collectionCount);
        progress.value = withSpring(target, SPRING_CONFIG);
      }
    });

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth <= 0 || measuredWidth === width) return;
    setWidth(measuredWidth);
    const target = nearestEquivalentIndex(activeIndex, progress.value, collectionCount);
    progress.value = target;
    dragStartProgress.value = target;
  }, [activeIndex, collectionCount, dragStartProgress, progress, width]);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        aria-label="Collection navigation. Swipe left or right to change tabs."
        className="mx-4"
        role="tablist"
        style={{
          height: CAROUSEL_SELECTOR_HEADROOM + CAROUSEL_BAR_HEIGHT,
          marginBottom: Math.max(bottomInset, 12) + 8,
        }}
      >
        <View
          onLayout={handleLayout}
          role="tablist"
          style={{
            bottom: 0,
            height: CAROUSEL_SELECTOR_HEADROOM + CAROUSEL_BAR_HEIGHT,
            left: 0,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        >
          {orderedCollections.map((collection, index) => (
            <CarouselArcTab
              key={collection.id}
              accent={accent}
              carouselSpacing={carouselSpacing}
              centerX={centerX}
              collection={collection}
              collectionCount={collectionCount}
              index={index}
              inactiveBorderColor={inactiveBorderColor}
              inactiveIconColor={inactiveIconColor}
              inactiveSurfaceColor={inactiveSurfaceColor}
              isActive={collection.id === activeCollection}
              onPress={() => onSelectIndex(index)}
              progress={progress}
            />
          ))}
        </View>

        {carouselSpacing > 0 && (
          <>
            <View
              pointerEvents="none"
              style={{
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)',
                borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#FFFFFF',
                borderRadius: CAROUSEL_SELECTOR_RADIUS,
                borderWidth: 2,
                height: CAROUSEL_SELECTOR_RADIUS * 2,
                justifyContent: 'center',
                left: centerX - CAROUSEL_SELECTOR_RADIUS,
                position: 'absolute',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                top: CAROUSEL_SELECTOR_TOP,
                width: CAROUSEL_SELECTOR_RADIUS * 2,
                zIndex: 16,
              }}
            >
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: isDark ? '#242426' : '#FAFAF7',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,22,0.12)',
                  borderRadius: 24,
                  borderWidth: 1,
                  height: 48,
                  justifyContent: 'center',
                  width: 48,
                }}
              />
            </View>

            {/* Selected Page Label in uppercase tiny */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: centerX - 70,
                width: 140,
                top: CAROUSEL_SELECTOR_TOP + CAROUSEL_SELECTOR_RADIUS * 2 + 8,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 18,
              }}
            >
              <Text
                numberOfLines={1}
                className={`text-[9.5px] ${typeface.semibold} tracking-widest text-center`}
                style={{
                  color: accent,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {activeMeta.label}
              </Text>
            </View>
          </>
        )}
      </View>
    </GestureDetector>
  );
}

// ==========================================
// 2. ORBIT MOVING RING (Fixed Icons, Sliding Ring)
// ==========================================

function OrbitMovingRingBar({
  orderedCollections,
  activeCollection,
  activeIndex,
  onSelectIndex,
  bottomInset,
  accent,
  isDark,
}: {
  orderedCollections: CollectionMeta[];
  activeCollection: CollectionId;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  bottomInset: number;
  accent: string;
  isDark: boolean;
}): React.JSX.Element {
  const typeface = useTypeface(activeCollection);
  const [width, setWidth] = useState(0);
  const collectionCount = orderedCollections.length;
  const itemWidth = width > 0 ? width / collectionCount : 0;
  const activeMeta = orderedCollections[activeIndex] ?? COLLECTIONS[0];

  const ringProgress = useSharedValue(activeIndex);
  const dragStartProgress = useSharedValue(activeIndex);

  useEffect(() => {
    ringProgress.value = withSpring(activeIndex, SPRING_CONFIG);
  }, [activeIndex, ringProgress]);

  const panGesture = Gesture.Pan()
    .enabled(itemWidth > 0)
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      cancelAnimation(ringProgress);
      dragStartProgress.value = ringProgress.value;
    })
    .onUpdate((event) => {
      ringProgress.value = Math.max(
        0,
        Math.min(collectionCount - 1, dragStartProgress.value + event.translationX / itemWidth)
      );
    })
    .onEnd((event) => {
      const velocityInTabs = event.velocityX / itemWidth;
      const projectedProgress = ringProgress.value + velocityInTabs * 0.15;
      const targetIndex = Math.max(
        0,
        Math.min(collectionCount - 1, Math.round(projectedProgress))
      );

      ringProgress.value = withSpring(targetIndex, SPRING_CONFIG);
      runOnJS(onSelectIndex)(targetIndex);
    })
    .onFinalize((_event, success) => {
      if (!success) {
        ringProgress.value = withSpring(activeIndex, SPRING_CONFIG);
      }
    });

  const animatedRingStyle = useAnimatedStyle(() => {
    if (itemWidth === 0) return { opacity: 0 };
    return {
      transform: [
        { translateX: ringProgress.value * itemWidth + (itemWidth - 58) / 2 },
      ],
      opacity: 1,
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    if (itemWidth === 0) return { opacity: 0 };
    return {
      transform: [
        { translateX: ringProgress.value * itemWidth + (itemWidth - 120) / 2 },
      ],
      opacity: 1,
    };
  });

  const handleLayout = (event: LayoutChangeEvent): void => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0 && measuredWidth !== width) {
      setWidth(measuredWidth);
      ringProgress.value = activeIndex;
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View
        onLayout={handleLayout}
        aria-label="Orbital moving ring navigation"
        role="tablist"
        className="mx-3"
        style={{
          height: 104,
          marginBottom: Math.max(bottomInset, 12) + 6,
          position: 'relative',
        }}
      >
        {/* Sliding Ring Selector */}
        {itemWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 10,
                left: 0,
                width: 58,
                height: 58,
                borderRadius: 29,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)',
                borderWidth: 2,
                borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#FFFFFF',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: 6,
                zIndex: 10,
              },
              animatedRingStyle,
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? '#242426' : '#FAFAF7',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,22,0.12)',
              }}
            />
          </Animated.View>
        )}

        {/* Fixed Icons Row */}
        <View className="flex-row items-center relative z-20" style={{ top: 10 }}>
          {orderedCollections.map((col, idx) => {
            const Icon = ICONS[col.id];
            const isSelected = activeCollection === col.id;
            return (
              <Pressable
                key={col.id}
                onPress={() => onSelectIndex(idx)}
                role="tab"
                aria-selected={isSelected}
                style={{
                  width: itemWidth > 0 ? itemWidth : `${100 / collectionCount}%`,
                  height: 58,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  size={isSelected ? 23 : 20}
                  color={isSelected ? accent : isDark ? '#F5F5F2' : '#55575C'}
                  strokeWidth={isSelected ? 2.3 : 1.9}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Dynamic Sliding Text Label */}
        {itemWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 76,
                left: 0,
                width: 120,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 25,
              },
              animatedLabelStyle,
            ]}
          >
            <Text
              numberOfLines={1}
              className={`text-[9.5px] ${typeface.semibold} tracking-widest text-center`}
              style={{
                color: accent,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {activeMeta.label}
            </Text>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

// ==========================================
// 3. NORMAL SLIDER (Classic Docked Bar with Sliding Background)
// ==========================================

function NormalSliderBar({
  orderedCollections,
  activeCollection,
  activeIndex,
  onSelectIndex,
  bottomInset,
  accent,
  isDark,
}: {
  orderedCollections: CollectionMeta[];
  activeCollection: CollectionId;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  bottomInset: number;
  accent: string;
  isDark: boolean;
}): React.JSX.Element {
  const typeface = useTypeface(activeCollection);
  const [width, setWidth] = useState(0);
  const collectionCount = orderedCollections.length;
  const itemWidth = width > 0 ? width / collectionCount : 0;

  const sliderProgress = useSharedValue(activeIndex);
  const dragStartProgress = useSharedValue(activeIndex);

  useEffect(() => {
    sliderProgress.value = withSpring(activeIndex, SPRING_CONFIG);
  }, [activeIndex, sliderProgress]);

  const panGesture = Gesture.Pan()
    .enabled(itemWidth > 0)
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      cancelAnimation(sliderProgress);
      dragStartProgress.value = sliderProgress.value;
    })
    .onUpdate((event) => {
      sliderProgress.value = Math.max(
        0,
        Math.min(collectionCount - 1, dragStartProgress.value + event.translationX / itemWidth)
      );
    })
    .onEnd((event) => {
      const velocityInTabs = event.velocityX / itemWidth;
      const targetIndex = Math.max(
        0,
        Math.min(collectionCount - 1, Math.round(sliderProgress.value + velocityInTabs * 0.15))
      );

      sliderProgress.value = withSpring(targetIndex, SPRING_CONFIG);
      runOnJS(onSelectIndex)(targetIndex);
    })
    .onFinalize((_event, success) => {
      if (!success) {
        sliderProgress.value = withSpring(activeIndex, SPRING_CONFIG);
      }
    });

  const animatedPillStyle = useAnimatedStyle(() => {
    if (itemWidth === 0) return { opacity: 0 };
    return {
      transform: [
        { translateX: sliderProgress.value * itemWidth + 4 },
      ],
      width: itemWidth - 8,
      opacity: 1,
    };
  });

  const handleLayout = (event: LayoutChangeEvent): void => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0 && measuredWidth !== width) {
      setWidth(measuredWidth);
      sliderProgress.value = activeIndex;
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View
        onLayout={handleLayout}
        aria-label="Bottom slider navigation"
        role="tablist"
        style={{
          backgroundColor: isDark ? '#1C1C1F' : '#F5F5EE',
          borderTopWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          paddingBottom: Math.max(bottomInset, 12),
          paddingTop: 6,
          paddingHorizontal: 4,
        }}
      >
        <View className="flex-row items-center relative py-1">
          {/* Animated Background Pill */}
          {itemWidth > 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 2,
                  bottom: 2,
                  left: 0,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.05)',
                  borderWidth: 1.5,
                  borderColor: accent,
                  zIndex: 5,
                },
                animatedPillStyle,
              ]}
            />
          )}

          {/* Tab Buttons */}
          {orderedCollections.map((col, idx) => {
            const Icon = ICONS[col.id];
            const isSelected = activeCollection === col.id;

            return (
              <Pressable
                key={col.id}
                onPress={() => onSelectIndex(idx)}
                role="tab"
                aria-selected={isSelected}
                className="flex-1 items-center justify-center py-2 px-1 relative z-10"
              >
                <Icon
                  size={19}
                  color={isSelected ? accent : isDark ? '#9A9A9E' : '#68686C'}
                  strokeWidth={isSelected ? 2.4 : 1.8}
                />
                <Text
                  numberOfLines={1}
                  className={`text-[10px] mt-1 ${isSelected ? typeface.semibold : typeface.medium}`}
                  style={{
                    color: isSelected
                      ? isDark
                        ? '#FFFFFF'
                        : '#1A1A1A'
                      : isDark
                      ? '#9A9A9E'
                      : '#68686C',
                  }}
                >
                  {col.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </GestureDetector>
  );
}

// ==========================================
// 4. FLOATING CAPSULE (Floating Frosted Glass Capsule)
// ==========================================

function FloatingCapsuleBar({
  orderedCollections,
  activeCollection,
  activeIndex,
  onSelectIndex,
  bottomInset,
  accent,
  isDark,
}: {
  orderedCollections: CollectionMeta[];
  activeCollection: CollectionId;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  bottomInset: number;
  accent: string;
  isDark: boolean;
}): React.JSX.Element {
  const typeface = useTypeface(activeCollection);
  const [width, setWidth] = useState(0);
  const collectionCount = orderedCollections.length;
  const itemWidth = width > 0 ? width / collectionCount : 0;

  const floatingProgress = useSharedValue(activeIndex);
  const dragStartProgress = useSharedValue(activeIndex);

  useEffect(() => {
    floatingProgress.value = withSpring(activeIndex, SPRING_CONFIG);
  }, [activeIndex, floatingProgress]);

  const panGesture = Gesture.Pan()
    .enabled(itemWidth > 0)
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      cancelAnimation(floatingProgress);
      dragStartProgress.value = floatingProgress.value;
    })
    .onUpdate((event) => {
      floatingProgress.value = Math.max(
        0,
        Math.min(collectionCount - 1, dragStartProgress.value + event.translationX / itemWidth)
      );
    })
    .onEnd((event) => {
      const velocityInTabs = event.velocityX / itemWidth;
      const targetIndex = Math.max(
        0,
        Math.min(collectionCount - 1, Math.round(floatingProgress.value + velocityInTabs * 0.15))
      );

      floatingProgress.value = withSpring(targetIndex, SPRING_CONFIG);
      runOnJS(onSelectIndex)(targetIndex);
    })
    .onFinalize((_event, success) => {
      if (!success) {
        floatingProgress.value = withSpring(activeIndex, SPRING_CONFIG);
      }
    });

  const animatedHighlightStyle = useAnimatedStyle(() => {
    if (itemWidth === 0) return { opacity: 0 };
    return {
      transform: [
        { translateX: floatingProgress.value * itemWidth + 5 },
      ],
      width: itemWidth - 10,
      opacity: 1,
    };
  });

  const handleLayout = (event: LayoutChangeEvent): void => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0 && measuredWidth !== width) {
      setWidth(measuredWidth);
      floatingProgress.value = activeIndex;
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View
        className="mx-4"
        style={{
          marginBottom: Math.max(bottomInset, 12) + 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.38 : 0.16,
          shadowRadius: 14,
          elevation: 10,
        }}
      >
        <View
          onLayout={handleLayout}
          aria-label="Floating capsule navigation"
          role="tablist"
          style={{
            height: 60,
            borderRadius: 30,
            overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(28, 28, 32, 0.78)' : 'rgba(255, 255, 255, 0.82)',
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
            justifyContent: 'center',
          }}
        >
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Sliding Pill Highlight */}
          {itemWidth > 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 5,
                  bottom: 5,
                  left: 0,
                  borderRadius: 25,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                  borderWidth: 1.5,
                  borderColor: accent,
                  zIndex: 5,
                },
                animatedHighlightStyle,
              ]}
            />
          )}

          {/* Icons and labels */}
          <View className="flex-row items-center relative z-10 px-1">
            {orderedCollections.map((col, idx) => {
              const Icon = ICONS[col.id];
              const isSelected = activeCollection === col.id;

              return (
                <Pressable
                  key={col.id}
                  onPress={() => onSelectIndex(idx)}
                  role="tab"
                  aria-selected={isSelected}
                  className="flex-1 items-center justify-center py-1.5"
                >
                  <Icon
                    size={20}
                    color={isSelected ? accent : isDark ? '#9A9A9E' : '#68686C'}
                    strokeWidth={isSelected ? 2.4 : 1.8}
                  />
                  <Text
                    numberOfLines={1}
                    className={`text-[9.5px] mt-0.5 ${isSelected ? typeface.semibold : typeface.medium}`}
                    style={{
                      color: isSelected
                        ? isDark
                          ? '#FFFFFF'
                          : '#1A1A1A'
                        : isDark
                        ? '#9A9A9E'
                        : '#68686C',
                    }}
                  >
                    {col.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

// ==========================================
// MAIN MULTI-STYLE BOTTOM TAB BAR
// ==========================================

export function BottomTabBar({
  activeCollection,
  onSelectCollection,
  bottomInset = 0,
  navigationStyle,
}: BottomTabBarProps): React.JSX.Element {
  const { settings } = useSettings();
  const activeStyle: NavigationStyle = navigationStyle ?? settings.navigationStyle ?? 'carousel';

  const orderedCollections = useMemo(
    () => getOrderedCollections(settings.collectionOrder),
    [settings.collectionOrder],
  );

  const activeIndex = Math.max(
    0,
    orderedCollections.findIndex((collection) => collection.id === activeCollection),
  );

  const collectionCount = orderedCollections.length;
  const accent = settings.generalThemeColor ?? '#7A967A';
  const isDark = settings.darkMode;

  const selectCollection = useCallback((id: CollectionId): void => {
    if (id === activeCollection) return;
    Haptics.selectionAsync().catch(() => {});
    onSelectCollection(id);
  }, [activeCollection, onSelectCollection]);

  const selectIndex = useCallback((index: number): void => {
    const normalizedIndex = ((index % collectionCount) + collectionCount) % collectionCount;
    const collection = orderedCollections[normalizedIndex];
    if (collection) selectCollection(collection.id);
  }, [collectionCount, orderedCollections, selectCollection]);

  if (activeStyle === 'orbit') {
    return (
      <OrbitMovingRingBar
        orderedCollections={orderedCollections}
        activeCollection={activeCollection}
        activeIndex={activeIndex}
        onSelectIndex={selectIndex}
        bottomInset={bottomInset}
        accent={accent}
        isDark={isDark}
      />
    );
  }

  if (activeStyle === 'slider') {
    return (
      <NormalSliderBar
        orderedCollections={orderedCollections}
        activeCollection={activeCollection}
        activeIndex={activeIndex}
        onSelectIndex={selectIndex}
        bottomInset={bottomInset}
        accent={accent}
        isDark={isDark}
      />
    );
  }

  if (activeStyle === 'floating') {
    return (
      <FloatingCapsuleBar
        orderedCollections={orderedCollections}
        activeCollection={activeCollection}
        activeIndex={activeIndex}
        onSelectIndex={selectIndex}
        bottomInset={bottomInset}
        accent={accent}
        isDark={isDark}
      />
    );
  }

  // Default: 'carousel'
  return (
    <CarouselArcBar
      orderedCollections={orderedCollections}
      activeCollection={activeCollection}
      activeIndex={activeIndex}
      onSelectIndex={selectIndex}
      bottomInset={bottomInset}
      accent={accent}
      isDark={isDark}
    />
  );
}

