import { View, Text, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { format } from 'date-fns';
import { X, Check, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react-native';
import { Thought, COLLECTIONS } from '../types';
import { CORNER_RADIUS, NEUTRAL, resolveTheme } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useAppearance } from '../hooks/useAppearance';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';
import { useTypeface } from '../hooks/useTypeface';

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
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const { gesture, animatedStyle, overlayStyle } = useSwipeToDismiss(onClose, !!thought);

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
    <Modal visible={!!thought} animationType="slide" transparent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View className="flex-1 justify-end bg-black/40" style={overlayStyle}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={onClose}
            aria-label="Dismiss modal backdrop"
          />
          <Animated.View
          className="p-6 pb-12 shadow-2xl max-h-[85%]"
          style={[
            {
              backgroundColor: palette.background,
              borderTopLeftRadius: appearance.sheetRadius,
              borderTopRightRadius: appearance.sheetRadius,
            },
            animatedStyle,
          ]}
        >
          <GestureDetector gesture={gesture}>
            <View className="-mx-6 -mt-6 px-6 pt-4 pb-3">
              <View className="items-center mb-4">
                <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: palette.border }} />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className={`text-xl ${typeface.semibold}`} style={{ color: palette.text }}>
                  {modalTitle}
                </Text>
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
              </View>
            </View>
          </GestureDetector>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2">
            {/* 1. LEARNINGS Detail */}
            {colId === 'learnings' && (
              <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                <Text className={`text-xl ${typeface.semibold} leading-8`} style={{ color: cardTextColor }}>
                  {thought.heading || thought.content}
                </Text>
                {Boolean(thought.subheading) && (
                  <Text className={`text-base ${typeface.regular} leading-6 mt-3`} style={{ color: mutedTextColor }}>
                    {thought.subheading}
                  </Text>
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
                <Text className={`text-xl ${typeface.semibold} leading-8`} style={{ color: cardTextColor }}>
                  {thought.heading || thought.content}
                </Text>
                {Boolean(thought.subheading) && (
                  <Text className={`text-base ${typeface.regular} leading-6 mt-3`} style={{ color: mutedTextColor }}>
                    {thought.subheading}
                  </Text>
                )}
              </View>
            )}

            {/* 3. SAYINGS Detail */}
            {colId === 'sayings' && (
              <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                <Text className={`text-2xl ${typeface.medium} leading-9 italic`} style={{ color: cardTextColor }}>
                  “{thought.content}”
                </Text>
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
                <Text className={`text-xl ${typeface.medium} leading-8`} style={{ color: cardTextColor }}>
                  {thought.content}
                </Text>
              </View>
            )}

            {/* 5. REMEMBER Detail */}
            {colId === 'remember' && (
              <>
                <View style={{ backgroundColor: cardBackground, borderRadius: radius }} className="p-6">
                  <Text className={`text-xl ${typeface.medium} leading-8`} style={{ color: cardTextColor }}>
                    {thought.content}
                  </Text>
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

            {/* Standard actions: Edit, Archive, Delete */}
            <Pressable
              onPress={onEdit}
              aria-label="Edit item"
              role="button"
              className="mt-4 rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={{ borderWidth: 1, borderColor: palette.border }}
            >
              <Pencil size={18} color={palette.text} />
              <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                Edit
              </Text>
            </Pressable>

            <Pressable
              onPress={onToggleArchive}
              aria-label={thought.archived ? 'Unarchive' : 'Archive'}
              role="button"
              className="mt-3 rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={{ borderWidth: 1, borderColor: palette.border }}
            >
              {thought.archived ? (
                <ArchiveRestore size={18} color={palette.textMuted} />
              ) : (
                <Archive size={18} color={palette.textMuted} />
              )}
              <Text className={`${typeface.medium} text-base`} style={{ color: palette.textMuted }}>
                {thought.archived ? 'Restore from archive' : 'Archive'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              aria-label="Delete item"
              role="button"
              className="mt-3 rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={{ borderWidth: 1, borderColor: '#C0554A' }}
            >
              <Trash2 size={18} color="#C0554A" />
              <Text className={`${typeface.medium} text-base`} style={{ color: '#C0554A' }}>
                Delete
              </Text>
            </Pressable>
            <View className="h-6" />
          </ScrollView>
        </Animated.View>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
