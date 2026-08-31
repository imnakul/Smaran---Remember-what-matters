import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check, Archive, Trash2, Eye } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactElement } from 'react';
import { format } from 'date-fns';
import { Thought, CARD_COLOR_STRENGTH } from '../types';
import { CORNER_RADIUS, NEUTRAL, resolveTheme } from '../constants/theme';
import {
  resolveCardRadius,
  resolveCardPaddingY,
  resolveCardMinHeight,
  resolveCardGapY,
} from '../constants/appearance';
import { withAlpha, mixHex } from '../lib/color';
import { useSettings } from '../context/SettingsContext';
import { useAppearance } from '../hooks/useAppearance';
import { useTypeface } from '../hooks/useTypeface';
import { CardEdgeArt } from './CardEdgeArt';

const TEXT_SIZE_MAP = { small: 15, medium: 18, large: 21 } as const;
const SWIPE_THRESHOLD = 88;

function formatAdditionDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return format(d, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

/**
 * Deleting needs a decidedly longer pull than archiving.
 *
 * Both live on the same left swipe, which keeps the gesture vocabulary small,
 * but the distance -- plus a distinct colour, icon and haptic at the crossing --
 * makes it hard to destroy a thought while meaning to pause one. An undo
 * snackbar backs it up for the times that is not enough.
 */
const DELETE_THRESHOLD = 200;

interface ThoughtCardProps {
  thought: Thought;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ON_DARK_SURFACE_TEXT = '#F1F1EF';
const ON_DARK_SURFACE_MUTED = 'rgba(241,241,239,0.55)';
const ON_LIGHT_SURFACE_TEXT = '#2D2D2D';
const ON_LIGHT_SURFACE_MUTED = 'rgba(0,0,0,0.4)';


interface HiddenLinesProps {
  /** Stable per-thought seed, so a card's bars never reshuffle between renders. */
  seed: string;
  lines: number;
  fontSize: number;
  lineHeight: number;
  color: string;
}

/**
 * Deterministic bar width as a percentage of the text column.
 *
 * Uneven widths, with a short final line, are what make the block read as
 * hidden writing rather than as a loading skeleton or a rendering failure.
 */
function hiddenBarWidth(seed: string, index: number, isLast: boolean): number {
  let hash = index * 31 + 7;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33 + seed.charCodeAt(i)) % 997;
  }
  return isLast ? 34 + (hash % 28) : 80 + (hash % 20);
}

/**
 * The stand-in for a hidden thought's text.
 *
 * The text is not drawn at all rather than obscured on top of. The two obvious
 * ways to obscure it both fail on Android: a `BlurView` renders as a flat
 * translucent tint that leaves the words perfectly readable, and transparent
 * text with a wide shadow paints the glyph outlines rather than a smear. Bars
 * have neither failure mode -- there is nothing underneath to read back, on
 * screen or out of a screenshot -- and they keep the shape and height of a
 * note, so the list still reads as a list rather than as a gap in one.
 */
function HiddenLines({ seed, lines, fontSize, lineHeight, color }: HiddenLinesProps): ReactElement {
  const barHeight = Math.round(fontSize * 0.6);

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: lines }, (_, index) => (
        <View key={index} style={{ height: lineHeight }} className="justify-center">
          <View
            style={{
              height: barHeight,
              width: `${hiddenBarWidth(seed, index, index === lines - 1)}%`,
              borderRadius: barHeight,
              backgroundColor: color,
            }}
          />
        </View>
      ))}
    </View>
  );
}


export function ThoughtCard({ thought, isCompleted, onToggle, onEdit, onOpen, onArchive, onDelete }: ThoughtCardProps) {
  const typeface = useTypeface(thought.collection);
  const { settings } = useSettings();
  const appearance = useAppearance(thought.collection);
  const theme = resolveTheme(thought);
  const neutral = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;

  const colTheme = thought.collection ? settings.collectionThemes?.[thought.collection] : undefined;
  const effectiveCorner = colTheme?.cardCorner ?? settings.cardCorner;
  const effectiveBorder = colTheme?.cardBorder ?? settings.cardBorder;
  const effectiveLook = colTheme?.cardLook ?? settings.cardLook;
  const effectiveDensity = colTheme?.cardDensity ?? settings.cardDensity;
  const effectiveSpacing = colTheme?.cardSpacing ?? settings.cardSpacing;
  const effectiveStrength = colTheme?.colorStrength ?? settings.colorStrength;

  const customRadius = colTheme?.customCornerRadius ?? settings.customCornerRadius;
  const radius = customRadius !== undefined ? customRadius : resolveCardRadius(appearance, effectiveCorner, CORNER_RADIUS);

  const customPad = colTheme?.customCardPaddingY ?? settings.customCardPaddingY;
  const paddingVertical = customPad !== undefined ? customPad : resolveCardPaddingY(appearance, effectiveDensity);

  const minHeight = customPad !== undefined ? Math.max(48, customPad * 2.2 + 20) : resolveCardMinHeight(appearance, effectiveDensity);
  const customDensityMultiplier = colTheme?.customCardDensity ?? settings.customCardDensity ?? 1.0;
  const baseGapY = resolveCardGapY(appearance, effectiveSpacing);
  const gapY = Math.round(baseGapY * customDensityMultiplier);
  const fontScale = colTheme?.fontSizeScale ?? settings.fontSizeScale ?? 1.0;
  const fontSize = Math.round(TEXT_SIZE_MAP[settings.textSize] * appearance.textScale * fontScale);

  /**
   * `cardLook` predates the look presets and only ever described the default
   * one. The other presets define their own surface outright.
   */
  const isSoftLook = appearance.id === 'soft';
  const isDarkLook = isSoftLook && effectiveLook === 'dark';
  const isNeonLook = isSoftLook && effectiveLook === 'neon';

  const isColorFilled = appearance.colorExpression === 'fill';
  /** Mono drops the palette entirely, so every accent falls back to ink. */
  const accent = appearance.monochrome ? neutral.text : theme.accent;

  const strength = CARD_COLOR_STRENGTH[effectiveStrength];
  const baseFill = settings.darkMode ? theme.darkBackground : theme.background;
  const strengthenedFill = mixHex(baseFill, theme.accent, strength.mix);

  const cardBackground = isDarkLook
    ? (settings.darkMode ? NEUTRAL.dark.surface : '#2D2D2D')
    : !isColorFilled
    ? neutral.surface
    : appearance.translucent
    ? withAlpha(strengthenedFill, strength.alpha)
    : strengthenedFill;

  const isSurfaceDark = isDarkLook || settings.darkMode;
  const textColor = isSurfaceDark ? ON_DARK_SURFACE_TEXT : ON_LIGHT_SURFACE_TEXT;
  const mutedTextColor = isSurfaceDark ? ON_DARK_SURFACE_MUTED : ON_LIGHT_SURFACE_MUTED;

  /**
   * Reveal is deliberately local and unpersisted: a hidden thought goes back to
   * hidden as soon as the list is rebuilt, so reading one does not quietly
   * leave it exposed for the rest of the day.
   */
  const [isRevealed, setIsRevealed] = useState(false);
  const isHidden = thought.spoiler === true && !isRevealed;

  useEffect(() => {
    setIsRevealed(false);
  }, [thought.id, thought.spoiler]);

  const reveal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRevealed(true);
  };

  const progress = useSharedValue(isCompleted ? 1 : 0);
  const pressScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  /** 0 none, 1 complete, 2 archive, 3 delete -- drives the threshold haptics. */
  const swipeStage = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isCompleted ? 1 : 0, { duration: 300 });
  }, [isCompleted, progress]);

  const handlePressIn = () => {
    pressScale.value = withTiming(0.985, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 150 });
  };

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const triggerThresholdHaptic = (stage: number) => {
    Haptics.impactAsync(
      stage === 3 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
    );
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      const stage =
        e.translationX > SWIPE_THRESHOLD
          ? 1
          : e.translationX < -DELETE_THRESHOLD
            ? 3
            : e.translationX < -SWIPE_THRESHOLD
              ? 2
              : 0;
      if (stage !== swipeStage.value) {
        swipeStage.value = stage;
        if (stage !== 0) runOnJS(triggerThresholdHaptic)(stage);
      }
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleToggle)();
      } else if (e.translationX < -DELETE_THRESHOLD) {
        runOnJS(onDelete)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(onArchive)();
      }
      translateX.value = withTiming(0, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      swipeStage.value = 0;
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      if (isHidden) {
        reveal();
      } else {
        onOpen();
      }
    });

  const cardGesture = Gesture.Simultaneous(swipeGesture, tapGesture);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }, { translateX: translateX.value }],
    opacity: 1 - progress.value * 0.3,
  }));

  const swipeBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [-DELETE_THRESHOLD, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      ['#B3372B', '#C99A4E', 'rgba(0,0,0,0)', '#5E8C5E']
    ),
  }));

  const completeIconStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, translateX.value / SWIPE_THRESHOLD)),
  }));

  // The two left-swipe icons cross-fade so the card always states which action
  // releasing right now would actually perform.
  const archiveIconStyle = useAnimatedStyle(() => {
    const appear = Math.max(0, Math.min(1, -translateX.value / SWIPE_THRESHOLD));
    const handOff = Math.max(
      0,
      Math.min(1, (-translateX.value - SWIPE_THRESHOLD) / (DELETE_THRESHOLD - SWIPE_THRESHOLD))
    );
    return { opacity: appear * (1 - handOff) };
  });

  const deleteIconStyle = useAnimatedStyle(() => {
    const fullyPrimed = Math.max(0, (-translateX.value - DELETE_THRESHOLD) / 20);
    return { opacity: Math.min(1, fullyPrimed) };
  });

  const strikeStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', theme.accent]),
    borderColor: interpolateColor(progress.value, [0, 1], ['rgba(0,0,0,0.1)', theme.accent]),
  }));

  const hasChosenBorder = settings.cardBorder !== 'none';

  /** Border the preset itself asks for: a frame in mono, a lit edge in glass. */
  const presetBorder =
    appearance.cardBorderWidth > 0 && !hasChosenBorder
      ? {
          borderWidth: appearance.cardBorderWidth,
          borderColor: appearance.monochrome
            ? neutral.text
            : appearance.translucent
            ? settings.darkMode
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(255,255,255,0.7)'
            : neutral.border,
        }
      : {};

  /** Editorial keeps colour off the card and states it as a rule in the margin. */
  const accentRule =
    appearance.colorExpression === 'rule' ? { borderLeftWidth: 3, borderLeftColor: accent } : {};

  /** A hairline separator instead of a shadow, for the looks that sit flat. */
  const dividerRule = appearance.divider
    ? { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: neutral.border }
    : {};

  /**
   * The user's chosen edge, honoured in every look rather than only in Soft.
   *
   * A control that silently does nothing in four of five looks is worse than no
   * control, so this wins over the look's own border whenever it is set. The two
   * painted treatments contribute no border style here -- they are drawn on top
   * by `CardEdgeArt` -- but they still suppress the preset's frame, so the card
   * never carries two edges at once.
   */
  const chosenBorder: ViewStyle =
    settings.cardBorder === 'left'
      ? { borderLeftWidth: 4, borderLeftColor: theme.accent }
      : settings.cardBorder === 'all'
      ? { borderWidth: 1.5, borderColor: theme.accent }
      : settings.cardBorder === 'dashed'
      ? { borderWidth: 2, borderStyle: 'dashed', borderColor: theme.accent }
      : settings.cardBorder === 'dotted'
      ? { borderWidth: 2, borderStyle: 'dotted', borderColor: theme.accent }
      : settings.cardBorder === 'neon'
      ? {
          borderWidth: 1.5,
          borderColor: theme.accent,
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 12,
          elevation: 10,
        }
      : {};


  const shadowStyle = isNeonLook
    ? {
        shadowColor: theme.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 14,
        elevation: 10,
      }
    : appearance.elevation > 0
    ? {
        shadowColor: appearance.monochrome ? 'rgba(0,0,0,0.18)' : theme.shadow,
        shadowOffset: { width: 0, height: Math.round(8 * appearance.elevation) },
        shadowOpacity: appearance.elevation,
        shadowRadius: 16 * appearance.elevation,
        elevation: Math.round(5 * appearance.elevation),
      }
    : {};

  const isCompact = appearance.id === 'compact';
  const metaLabel = `Repeats every ${thought.repeatIntervalDays} ${
    thought.repeatIntervalDays === 1 ? 'day' : 'days'
  }`;
  const displayMetaLabel = appearance.metaUppercase ? metaLabel.toUpperCase() : metaLabel;
  const revealLabel = appearance.metaUppercase ? 'TAP TO REVEAL' : 'Tap to reveal';

  return (
    <View className={appearance.cardGap} style={{ marginVertical: gapY }}>
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 flex-row items-center justify-between px-8"
        style={[{ borderRadius: radius }, swipeBackgroundStyle]}
      >
        <Animated.View style={completeIconStyle}>
          <Check size={22} color="#FFFFFF" />
        </Animated.View>
        <View>
          <Animated.View style={archiveIconStyle}>
            <Archive size={20} color="#FFFFFF" />
          </Animated.View>
          <Animated.View className="absolute inset-0 items-center justify-center" style={deleteIconStyle}>
            <Trash2 size={20} color="#FFFFFF" />
          </Animated.View>
        </View>
      </Animated.View>

      <GestureDetector gesture={cardGesture}>
        <AnimatedPressable
          onPress={isHidden ? reveal : onOpen}
          onLongPress={onEdit}
          delayLongPress={500}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          // The content stays out of the accessibility label while hidden -- a
          // spoiler a screen reader reads aloud anyway is not a spoiler.
          aria-label={isHidden ? 'Hidden thought. Tap to reveal.' : `Thought: ${thought.content}`}
          role="button"
          style={[
            {
              backgroundColor: cardBackground,
              borderRadius: radius,
              minHeight,
              paddingVertical,
              ...shadowStyle,
              ...presetBorder,
              ...accentRule,
              ...dividerRule,
              ...chosenBorder,
            },
            cardAnimatedStyle,
          ]}
          className={`${appearance.cardPaddingX} flex-row items-center justify-between`}
        >
          {appearance.translucent && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
            >
              <BlurView
                intensity={28}
                tint={settings.darkMode ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          <CardEdgeArt border={settings.cardBorder} radius={radius} accent={theme.accent} />

          {appearance.colorExpression === 'dot' && (
            <View
              className="w-2 h-2 rounded-full mr-3"
              style={{ backgroundColor: accent }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          )}

          {/* ========================================================= */}
          {/* 1. LEARNINGS: Heading + Subheading + Date of addition */}
          {/* ========================================================= */}
          {thought.collection === 'learnings' ? (
            <View className="flex-1">
              <Text
                className={`${typeface.semibold}`}
                style={{ color: textColor, fontSize: fontSize * 1.05, lineHeight: fontSize * 1.35 }}
              >
                {thought.heading || thought.content}
              </Text>
              {Boolean(thought.subheading) && (
                <Text
                  className={`${typeface.regular} mt-1.5`}
                  style={{ color: mutedTextColor, fontSize: Math.round(fontSize * 0.86), lineHeight: fontSize * 1.25 }}
                >
                  {thought.subheading}
                </Text>
              )}
              <View className="flex-row items-center gap-1.5 mt-3">
                <Text
                  className={`${typeface.medium}`}
                  style={{
                    color: mutedTextColor,
                    fontSize: 11,
                    letterSpacing: 0.3,
                  }}
                >
                  Added {formatAdditionDate(thought.createdAt)}
                </Text>
              </View>
            </View>
          ) : thought.collection === 'blessings' ? (
            /* 2. BLESSINGS: Date at top + Heading + Subheading */
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <Text
                  className={`${typeface.semibold}`}
                  style={{
                    color: settings.darkMode ? '#A3C4A3' : '#557A55',
                    fontSize: 11,
                    letterSpacing: 0.4,
                  }}
                >
                  {formatAdditionDate(thought.eventDate || thought.createdAt)}
                </Text>
              </View>
              <Text
                className={`${typeface.semibold}`}
                style={{ color: textColor, fontSize: fontSize * 1.05, lineHeight: fontSize * 1.35 }}
              >
                {thought.heading || thought.content}
              </Text>
              {Boolean(thought.subheading) && (
                <Text
                  className={`${typeface.regular} mt-1.5`}
                  style={{ color: mutedTextColor, fontSize: Math.round(fontSize * 0.86), lineHeight: fontSize * 1.25 }}
                >
                  {thought.subheading}
                </Text>
              )}
            </View>
          ) : thought.collection === 'sayings' ? (
            /* 3. SAYINGS: Quote + Name/Author below */
            <View className="flex-1">
              <Text
                className={`${typeface.medium}`}
                style={{
                  color: textColor,
                  fontSize: fontSize * 1.02,
                  lineHeight: fontSize * 1.45,
                  fontStyle: 'italic',
                }}
              >
                “{thought.content}”
              </Text>
              {Boolean(thought.author) && (
                <View className="flex-row justify-end mt-2.5">
                  <Text
                    className={`${typeface.semibold}`}
                    style={{
                      color: settings.darkMode ? '#C8D6C8' : '#456045',
                      fontSize: Math.round(fontSize * 0.88),
                    }}
                  >
                    — {thought.author}
                  </Text>
                </View>
              )}
            </View>
          ) : thought.collection === 'tryDoing' ? (
            /* 4. TRY DOING: Action / Experiment text */
            <View className="flex-1">
              <Text
                className={`${typeface.medium}`}
                style={{ color: textColor, fontSize, lineHeight: fontSize * 1.4 }}
              >
                {thought.content}
              </Text>
            </View>
          ) : (
            /* 5. REMEMBER (Default): Content + Repeat schedule + Checkbox */
            /* ========================================================= */
            <>
              <View className="flex-1 mr-4">
                {isHidden ? (
                  <HiddenLines
                    seed={thought.id}
                    lines={isCompact ? 2 : 3}
                    fontSize={fontSize}
                    lineHeight={fontSize * 1.4}
                    color={withAlpha(textColor, 0.22)}
                  />
                ) : (
                  <View className="relative">
                    <Text
                      numberOfLines={isCompact ? 2 : 3}
                      ellipsizeMode="tail"
                      className={`${typeface.medium}`}
                      style={{ color: textColor, fontSize, lineHeight: fontSize * 1.4 }}
                    >
                      {thought.content}
                    </Text>
                    <Animated.Text
                      numberOfLines={isCompact ? 2 : 3}
                      ellipsizeMode="tail"
                      className={`absolute top-0 left-0 right-0 ${typeface.medium}`}
                      style={[
                        {
                          color: textColor,
                          fontSize,
                          lineHeight: fontSize * 1.4,
                          textDecorationLine: 'line-through',
                          textDecorationColor: textColor,
                        },
                        strikeStyle,
                      ]}
                    >
                      {thought.content}
                    </Animated.Text>
                  </View>
                )}
                <View className="flex-row items-center gap-1.5" style={{ marginTop: isCompact ? 2 : 12 }}>
                  {isHidden && <Eye size={12} color={mutedTextColor} />}
                  <Text
                    className={`${typeface.regular}`}
                    style={{
                      color: mutedTextColor,
                      fontSize: appearance.metaUppercase ? 10 : 12,
                      letterSpacing: appearance.metaTracking,
                    }}
                  >
                    {isHidden ? revealLabel : displayMetaLabel}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleToggle}
                aria-label={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
                role="checkbox"
                className={`${isCompact ? 'w-7 h-7' : 'w-9 h-9'} rounded-full items-center justify-center border`}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Animated.View
                  style={[checkmarkStyle, { position: 'absolute', width: '100%', height: '100%', borderRadius: 18 }]}
                />
                <Animated.View style={{ opacity: progress }}>
                  <Check size={16} color={theme.background} />
                </Animated.View>
              </Pressable>
            </>
          )}
        </AnimatedPressable>
      </GestureDetector>
    </View>
  );
}
