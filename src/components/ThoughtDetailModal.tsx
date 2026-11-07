import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { format } from 'date-fns';
import { X, Check, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react-native';
import { Thought, COLLECTIONS } from '../types';
import { CORNER_RADIUS, NEUTRAL, resolveTheme } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useAppearance } from '../hooks/useAppearance';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';
import { useTypeface } from '../hooks/useTypeface';
import { RichText } from './RichText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ThoughtDetailModalProps {
  thought: Thought | null;
  isCompleted: boolean;
  onClose: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

function formatDetailDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return format(d, 'MMMM d, yyyy');
  } catch {
    return '';
  }
}

export function ThoughtDetailModal({ thought, isCompleted, onClose, onToggle, onEdit, onToggleArchive, onDelete }: ThoughtDetailModalProps) {
  const typeface = useTypeface(thought?.collection);
  const { settings } = useSettings();
  const appearance = useAppearance(thought?.collection);
  const isFrosted = appearance.chromeBlur > 0;
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const { gesture, animatedStyle, overlayStyle, dismiss } = useSwipeToDismiss(onClose, !!thought, {
    animateIn: true,
  });

  if (!thought) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete item',
      'This will permanently delete this record. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const theme = resolveTheme(thought);
  const radius = CORNER_RADIUS[settings.cardCorner];
  const cardBackground = settings.darkMode ? theme.darkBackground : theme.background;
  const cardTextColor = settings.darkMode ? '#F1F1EF' : '#2D2D2D';
  const mutedTextColor = settings.darkMode ? 'rgba(241,241,239,0.6)' : 'rgba(0,0,0,0.5)';

  const colId = thought.collection ?? 'remember';
  const collectionMeta = COLLECTIONS.find(c => c.id === colId) ?? COLLECTIONS[0];
  const isRemember = colId === 'remember';

  const modalTitle =
    colId === 'learnings'
      ? 'Learning'
      : colId === 'blessings'
      ? 'Blessing'
      : colId === 'sayings'
      ? 'Saying'
      : colId === 'tryDoing'
      ? 'Experiment'
      : 'Thought';

  return (
    <View style={StyleSheet.absoluteFill} className="justify-end z-50">
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, overlayStyle]}
        className="bg-black/40"
        onPress={dismiss}
        aria-label="Dismiss modal backdrop"
        role="button"
      />
      <Animated.View
        className="p-6 pb-12 shadow-2xl max-h-[85%] overflow-hidden"
        style={[
          {
            backgroundColor: isFrosted ? 'transparent' : palette.background,
            borderTopLeftRadius: appearance.sheetRadius,
            borderTopRightRadius: appearance.sheetRadius,
          },
          animatedStyle,
        ]}
      >
        {isFrosted && (
          <>
            <BlurView
              intensity={Math.min(100, appearance.chromeBlur + 45)}
              tint={settings.darkMode ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: settings.darkMode
                    ? 'rgba(22, 22, 22, 0.88)'
                    : 'rgba(255, 255, 255, 0.86)',
                },
              ]}
              pointerEvents="none"
            />
          </>
        )}
          <GestureDetector gesture={gesture}>
            <View className="-mx-6 -mt-6 px-6 pt-4 pb-3">
              <View className="items-center mb-4">
                <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: palette.border }} />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className={`text-xl ${typeface.semibold}`} style={{ color: palette.text }}>
                  {modalTitle}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: settings.darkMode ? 'rgba(143, 168, 143, 0.15)' : 'rgba(122, 150, 122, 0.1)',
                      borderColor: settings.darkMode ? 'rgba(143, 168, 143, 0.3)' : 'rgba(122, 150, 122, 0.25)',
                    }}
                  >
                    <Text
                      className={`text-xs ${typeface.medium}`}
                      style={{ color: settings.darkMode ? '#8FA88F' : '#7A967A' }}
                    >
                      {collectionMeta.label}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onEdit}
                    aria-label="Edit item"
                    role="button"
                    className="w-8 h-8 rounded-full items-center justify-center border"
                    style={{
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                    }}
                  >
                    <Pencil size={15} color={palette.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          </GestureDetector>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2">
            {/* 1. LEARNINGS Detail */}
            {colId === 'learnings' && (
              <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                <RichText
                  text={thought.heading || thought.content}
                  className={`text-xl ${typeface.semibold} leading-8`}
                  style={{ color: cardTextColor }}
                  collectionId={thought.collection}
                  baseWeight="semibold"
                />
                {Boolean(thought.subheading) && (
                  <RichText
                    text={thought.subheading}
                    className={`text-base ${typeface.regular} leading-6 mt-3`}
                    style={{ color: mutedTextColor }}
                    collectionId={thought.collection}
                    baseWeight="regular"
                  />
                )}
                <View className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 flex-row items-center justify-between">
                  <Text className={`text-xs ${typeface.medium}`} style={{ color: mutedTextColor }}>
                    Recorded on {formatDetailDate(thought.createdAt)}
                  </Text>
                </View>
              </View>
            )}

            {/* 2. BLESSINGS Detail */}
            {colId === 'blessings' && (
              <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                <Text className={`text-xs ${typeface.semibold} mb-2`} style={{ color: settings.darkMode ? '#A3C4A3' : '#557A55' }}>
                  {formatDetailDate(thought.eventDate || thought.createdAt)}
                </Text>
                <RichText
                  text={thought.heading || thought.content}
                  className={`text-xl ${typeface.semibold} leading-8`}
                  style={{ color: cardTextColor }}
                  collectionId={thought.collection}
                  baseWeight="semibold"
                />
                {Boolean(thought.subheading) && (
                  <RichText
                    text={thought.subheading}
                    className={`text-base ${typeface.regular} leading-6 mt-3`}
                    style={{ color: mutedTextColor }}
                    collectionId={thought.collection}
                    baseWeight="regular"
                  />
                )}
              </View>
            )}

            {/* 3. SAYINGS Detail */}
            {colId === 'sayings' && (
              <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                <RichText
                  text={thought.content}
                  className={`text-2xl ${typeface.medium} leading-9 italic`}
                  style={{ color: cardTextColor }}
                  collectionId={thought.collection}
                  baseWeight="medium"
                  italicAll
                />
                {Boolean(thought.author) && (
                  <View className="flex-row justify-end mt-4">
                    <Text className={`text-base ${typeface.semibold}`} style={{ color: settings.darkMode ? '#C8D6C8' : '#456045' }}>
                      — {thought.author}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 4. TRY DOING Detail */}
            {colId === 'tryDoing' && (
              <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                <RichText
                  text={thought.content}
                  className={`text-xl ${typeface.medium} leading-8`}
                  style={{ color: cardTextColor }}
                  collectionId={thought.collection}
                  baseWeight="medium"
                />
              </View>
            )}

            {/* 5. REMEMBER Detail */}
            {colId === 'remember' && (
              <>
                <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                  <RichText
                    text={thought.content}
                    className={`text-xl ${typeface.medium} leading-8`}
                    style={{ color: cardTextColor }}
                    collectionId={thought.collection}
                    baseWeight="medium"
                  />
                </View>

                <View className="flex-row items-center justify-between mt-4 px-1">
                  <Text className={`text-sm ${typeface.regular}`} style={{ color: palette.textMuted }}>
                    Repeats every {thought.repeatIntervalDays} {thought.repeatIntervalDays === 1 ? 'day' : 'days'}
                  </Text>
                </View>

                <Pressable
                  onPress={onToggle}
                  aria-label={isCompleted ? 'Mark as not completed' : 'Mark as completed for today'}
                  role="button"
                  className="mt-6 rounded-2xl py-4 flex-row items-center justify-center gap-2"
                  style={{
                    backgroundColor: isCompleted ? 'transparent' : palette.text,
                    borderWidth: isCompleted ? 1 : 0,
                    borderColor: palette.border,
                  }}
                >
                  <Check size={20} color={isCompleted ? palette.text : palette.background} />
                  <Text
                    className={`${typeface.semibold} text-base`}
                    style={{ color: isCompleted ? palette.text : palette.background }}
                  >
                    {isCompleted ? 'Completed for today' : 'Mark as completed'}
                  </Text>
                </Pressable>
              </>
            )}

            {/* Standard actions: Line 1: Edit, Line 2: Archive & Delete (50% 50%) */}
            <Pressable
              onPress={onEdit}
              aria-label="Edit item"
              role="button"
              className="mt-5 rounded-2xl py-3.5 flex-row items-center justify-center gap-2 border"
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
              }}
            >
              <Pencil size={17} color={palette.text} />
              <Text className={`${typeface.semibold} text-base`} style={{ color: palette.text }}>
                Edit
              </Text>
            </Pressable>

            {/* Second line: Archive (50%) & Delete (50%) in same line */}
            <View className="flex-row items-center gap-3 mt-3">
              <Pressable
                onPress={onToggleArchive}
                aria-label={thought.archived ? 'Restore from archive' : 'Archive item'}
                role="button"
                className="flex-1 rounded-2xl py-3.5 flex-row items-center justify-center gap-2 border"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                }}
              >
                {thought.archived ? (
                  <ArchiveRestore size={16} color={palette.textMuted} />
                ) : (
                  <Archive size={16} color={palette.textMuted} />
                )}
                <Text className={`${typeface.medium} text-sm`} style={{ color: palette.textMuted }}>
                  {thought.archived ? 'Restore' : 'Archive'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                aria-label="Delete item"
                role="button"
                className="flex-1 rounded-2xl py-3.5 flex-row items-center justify-center gap-2 border"
                style={{
                  backgroundColor: settings.darkMode
                    ? 'rgba(192, 85, 74, 0.12)'
                    : 'rgba(192, 85, 74, 0.08)',
                  borderColor: settings.darkMode
                    ? 'rgba(192, 85, 74, 0.35)'
                    : 'rgba(192, 85, 74, 0.25)',
                }}
              >
                <Trash2 size={16} color="#C0554A" />
                <Text className={`${typeface.medium} text-sm`} style={{ color: '#C0554A' }}>
                  Delete
                </Text>
              </Pressable>
            </View>
            <View className="h-6" />
          </ScrollView>
        </Animated.View>
    </View>
  );
}
