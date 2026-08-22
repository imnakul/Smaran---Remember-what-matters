import { View, Text, Modal, TextInput, Pressable, ScrollView, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Thought, ThemeId, ThoughtDraft, CollectionId, COLLECTIONS } from '../types';
import { THEMES, NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useAppearance } from '../hooks/useAppearance';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';
import { HueSlider } from './HueSlider';
import { hslToHex, hexToHue } from '../lib/color';
import { X, Check, Palette, EyeOff, Brain, BookOpen, Sparkles, Quote, Zap, Calendar as CalendarIcon } from 'lucide-react-native';
import { useTypeface } from '../hooks/useTypeface';

interface AddEditThoughtModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ThoughtDraft) => void;
  initialData?: Thought;
  /** Pre-fills the content field for a new thought (e.g. from a shared link/text) without entering edit mode. */
  initialContent?: string;
  /** Life collection to assign by default for a new thought */
  defaultCollection?: CollectionId;
}

const INTERVAL_OPTIONS = [1, 3, 7, 14, 30];

const COLLECTION_ICONS = {
  remember: Brain,
  learnings: BookOpen,
  blessings: Sparkles,
  sayings: Quote,
  tryDoing: Zap,
};

export function AddEditThoughtModal({
  visible,
  onClose,
  onSave,
  initialData,
  initialContent,
  defaultCollection = 'remember',
}: AddEditThoughtModalProps) {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const appearance = useAppearance();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const { gesture, animatedStyle, overlayStyle } = useSwipeToDismiss(onClose, visible);

  const [collection, setCollection] = useState<CollectionId>(defaultCollection);
  const [content, setContent] = useState('');
  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [author, setAuthor] = useState('');
  const [eventDate, setEventDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [interval, setInterval] = useState(1);
  const [customInterval, setCustomInterval] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [theme, setTheme] = useState<ThemeId>('sage');
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customHue, setCustomHue] = useState(0);
  const [spoiler, setSpoiler] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        const col = initialData.collection ?? 'remember';
        setCollection(col);
        setContent(initialData.content);
        setHeading(initialData.heading ?? (col === 'learnings' || col === 'blessings' ? initialData.content : ''));
        setSubheading(initialData.subheading ?? '');
        setAuthor(initialData.author ?? '');
        setEventDate(initialData.eventDate ?? format(new Date(), 'yyyy-MM-dd'));

        if (INTERVAL_OPTIONS.includes(initialData.repeatIntervalDays)) {
          setInterval(initialData.repeatIntervalDays);
          setIsCustom(false);
        } else {
          setInterval(0);
          setCustomInterval(initialData.repeatIntervalDays.toString());
          setIsCustom(true);
        }
        setTheme(initialData.colorTheme);
        if (initialData.customColor) {
          setUseCustomColor(true);
          setCustomHue(hexToHue(initialData.customColor));
        } else {
          setUseCustomColor(false);
        }
        setSpoiler(initialData.spoiler === true);
      } else {
        setCollection(defaultCollection);
        setContent(initialContent ?? '');
        setHeading('');
        setSubheading('');
        setAuthor('');
        setEventDate(format(new Date(), 'yyyy-MM-dd'));
        setInterval(1);
        setCustomInterval('');
        setIsCustom(false);
        setTheme('sage');
        setUseCustomColor(false);
        setCustomHue(0);
        setSpoiler(false);
      }
    }
  }, [visible, initialData, initialContent, defaultCollection]);

  const customColorHex = hslToHex(customHue, 0.4, 0.55);

  const openDatePicker = () => {
    const initial = eventDate ? new Date(eventDate) : new Date();
    DateTimePickerAndroid.open({
      value: isNaN(initial.getTime()) ? new Date() : initial,
      mode: 'date',
      onChange: (_event, selected) => {
        if (!selected) return;
        setEventDate(format(selected, 'yyyy-MM-dd'));
      },
    });
  };

  const handleSave = () => {
    let finalContent = content.trim();
    let finalHeading = heading.trim();
    let finalSubheading = subheading.trim();
    let finalAuthor = author.trim();

    if (collection === 'learnings' || collection === 'blessings') {
      if (!finalHeading && !finalContent) return;
      if (!finalContent) finalContent = finalHeading;
      if (!finalHeading) finalHeading = finalContent;
    } else if (collection === 'sayings') {
      if (!finalContent) return;
    } else {
      if (!finalContent) return;
    }

    let finalInterval = interval;
    if (isCustom) {
      const parsed = parseInt(customInterval, 10);
      if (isNaN(parsed) || parsed <= 0) return;
      finalInterval = parsed;
    }

    onSave({
      content: finalContent,
      collection,
      heading: finalHeading || undefined,
      subheading: finalSubheading || undefined,
      author: finalAuthor || undefined,
      eventDate: collection === 'blessings' ? eventDate : undefined,
      repeatIntervalDays: collection === 'remember' ? finalInterval : 1,
      colorTheme: theme,
      customColor: useCustomColor ? customColorHex : undefined,
      spoiler: collection === 'remember' && spoiler ? true : undefined,
    });
  };

  const modalTitle = initialData
    ? collection === 'learnings'
      ? 'Edit Learning'
      : collection === 'blessings'
      ? 'Edit Blessing'
      : collection === 'sayings'
      ? 'Edit Saying'
      : collection === 'tryDoing'
      ? 'Edit Experiment'
      : 'Edit Thought'
    : collection === 'learnings'
    ? 'New Learning'
    : collection === 'blessings'
    ? 'New Blessing'
    : collection === 'sayings'
    ? 'New Saying'
    : collection === 'tryDoing'
    ? 'New Experiment'
    : 'New Thought';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View className="flex-1 justify-end bg-black/40" style={overlayStyle}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={onClose}
            aria-label="Dismiss modal backdrop"
          />
          <Animated.View
          className="p-6 pb-12 shadow-2xl h-[85%]"
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
              <Text className={`text-xl ${typeface.semibold} mb-2`} style={{ color: palette.text }}>
                {modalTitle}
              </Text>
            </View>
          </GestureDetector>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Life Collection selector */}
            <View className="mb-4">
              <Text className={`text-xs ${typeface.medium} mb-2 ml-1`} style={{ color: palette.textMuted }}>
                Collection
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {COLLECTIONS.map(item => {
                  const isSelected = collection === item.id;
                  const Icon = COLLECTION_ICONS[item.id];
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setCollection(item.id)}
                      role="button"
                      aria-selected={isSelected}
                      aria-label={`Collection ${item.label}`}
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border"
                      style={{
                        backgroundColor: isSelected
                          ? settings.darkMode
                            ? 'rgba(143, 168, 143, 0.25)'
                            : 'rgba(122, 150, 122, 0.18)'
                          : 'transparent',
                        borderColor: isSelected
                          ? settings.darkMode
                            ? '#8FA88F'
                            : '#7A967A'
                          : palette.border,
                      }}
                    >
                      <Icon
                        size={13}
                        color={
                          isSelected
                            ? settings.darkMode
                              ? '#8FA88F'
                              : '#7A967A'
                            : palette.textMuted
                        }
                      />
                      <Text
                        className={`text-xs ${isSelected ? typeface.semibold : typeface.medium}`}
                        style={{
                          color: isSelected
                            ? settings.darkMode
                              ? '#E1EBE1'
                              : '#3E5C3E'
                            : palette.textMuted,
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* ========================================================= */}
            {/* 1. LEARNINGS: Heading + Subheading / Breakdown */}
            {/* ========================================================= */}
            {collection === 'learnings' && (
              <View className="gap-3">
                <View>
                  <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                    Heading / Key Takeaway
                  </Text>
                  <TextInput
                    className={`rounded-2xl p-4 text-base ${typeface.semibold} border`}
                    style={{ backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                    placeholder="e.g. The Feynman Technique for deep mastery"
                    placeholderTextColor={palette.textMuted}
                    value={heading}
                    onChangeText={setHeading}
                  />
                </View>
                <View>
                  <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                    Subheading / Reflection & Notes
                  </Text>
                  <TextInput
                    className={`rounded-2xl p-4 text-base ${typeface.regular} border`}
                    style={{ minHeight: 110, textAlignVertical: 'top', backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                    multiline
                    placeholder="Explain the concept simply as if teaching someone else, identify gaps, and refine..."
                    placeholderTextColor={palette.textMuted}
                    value={subheading}
                    onChangeText={setSubheading}
                  />
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* 2. BLESSINGS: Date + Heading + Subheading */}
            {/* ========================================================= */}
            {collection === 'blessings' && (
              <View className="gap-3">
                <View>
                  <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                    Date of Blessing
                  </Text>
                  <Pressable
                    onPress={openDatePicker}
                    className="flex-row items-center justify-between p-4 rounded-2xl border"
                    style={{ backgroundColor: palette.surface, borderColor: palette.border }}
                  >
                    <View className="flex-row items-center gap-2.5">
                      <CalendarIcon size={16} color={palette.text} />
                      <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.text }}>
                        {format(new Date(eventDate), 'MMMM d, yyyy')}
                      </Text>
                    </View>
                    <Text className={`text-xs ${typeface.medium}`} style={{ color: '#7A967A' }}>
                      Change Date
                    </Text>
                  </Pressable>
                </View>
                <View>
                  <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                    Gratitude Headline
                  </Text>
                  <TextInput
                    className={`rounded-2xl p-4 text-base ${typeface.semibold} border`}
                    style={{ backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                    placeholder="e.g. A peaceful morning cup of coffee in the sun"
                    placeholderTextColor={palette.textMuted}
                    value={heading}
                    onChangeText={setHeading}
                  />
                </View>
                <View>
                  <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                    Subheading / Why this was a blessing
                  </Text>
                  <TextInput
                    className={`rounded-2xl p-4 text-base ${typeface.regular} border`}
                    style={{ minHeight: 90, textAlignVertical: 'top', backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                    multiline
                    placeholder="Gave me clarity, presence, and calm before starting a busy day..."
                    placeholderTextColor={palette.textMuted}
                    value={subheading}
                    onChangeText={setSubheading}
                  />
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* 3. SAYINGS: Quote + Said By / Author */}
            {/* ========================================================= */}
            {collection === 'sayings' && (
              <View className="gap-3">
                <View>
                  <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                    Quote / Saying
                  </Text>
                  <TextInput
                    className={`rounded-2xl p-4 text-base ${typeface.medium} border`}
                    style={{ minHeight: 110, textAlignVertical: 'top', backgroundColor: palette.surface, color: palette.text, borderColor: palette.border, fontStyle: 'italic' }}
                    multiline
                    placeholder="Waste no more time arguing what a good man should be. Be one."
                    placeholderTextColor={palette.textMuted}
                    value={content}
                    onChangeText={setContent}
                  />
                </View>
                <View>
                  <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                    Said By / Author
                  </Text>
                  <TextInput
                    className={`rounded-2xl p-4 text-sm ${typeface.semibold} border`}
                    style={{ backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                    placeholder="e.g. Marcus Aurelius"
                    placeholderTextColor={palette.textMuted}
                    value={author}
                    onChangeText={setAuthor}
                  />
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* 4. TRY DOING: Experiment / Action Prompt */}
            {/* ========================================================= */}
            {collection === 'tryDoing' && (
              <View>
                <Text className={`text-xs ${typeface.medium} mb-1 ml-1`} style={{ color: palette.textMuted }}>
                  Experiment or Habit to Try
                </Text>
                <TextInput
                  className={`rounded-2xl p-4 text-base ${typeface.regular} border`}
                  style={{ minHeight: 110, textAlignVertical: 'top', backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                  multiline
                  placeholder="e.g. Go for a 15-minute phone-free morning walk in natural light"
                  placeholderTextColor={palette.textMuted}
                  value={content}
                  onChangeText={setContent}
                />
              </View>
            )}

            {/* ========================================================= */}
            {/* 5. REMEMBER: Standard Thought Text + Interval */}
            {/* ========================================================= */}
            {collection === 'remember' && (
              <>
                <TextInput
                  className={`rounded-[24px] p-6 text-lg ${typeface.regular} border`}
                  style={{ minHeight: 120, textAlignVertical: 'top', backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                  multiline
                  placeholder="What do you want to remember?"
                  placeholderTextColor={palette.textMuted}
                  value={content}
                  onChangeText={setContent}
                />

                <Text className={`text-sm ${typeface.medium} mt-8 mb-4 ml-2`} style={{ color: palette.textMuted }}>
                  Repeat every
                </Text>

                <View className="flex-row flex-wrap gap-3">
                  {INTERVAL_OPTIONS.map((days) => (
                    <Pressable
                      key={days}
                      onPress={() => {
                        setIsCustom(false);
                        setInterval(days);
                      }}
                      className="px-4 py-3 rounded-full border"
                      style={{
                        backgroundColor: !isCustom && interval === days ? palette.text : 'transparent',
                        borderColor: !isCustom && interval === days ? palette.text : palette.border,
                      }}
                    >
                      <Text
                        className={`${typeface.medium}`}
                        style={{ color: !isCustom && interval === days ? palette.background : palette.text }}
                      >
                        {days} {days === 1 ? 'day' : 'days'}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => {
                      setIsCustom(true);
                      setInterval(0);
                    }}
                    className="px-4 py-3 rounded-full border"
                    style={{
                      backgroundColor: isCustom ? palette.text : 'transparent',
                      borderColor: isCustom ? palette.text : palette.border,
                    }}
                  >
                    <Text
                      className={`${typeface.medium}`}
                      style={{ color: isCustom ? palette.background : palette.text }}
                    >
                      Custom
                    </Text>
                  </Pressable>
                </View>

                {isCustom && (
                  <View className="flex-row items-center gap-3 mt-4 ml-2">
                    <TextInput
                      className={`w-20 rounded-2xl p-3 text-center border ${typeface.medium}`}
                      style={{ backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }}
                      keyboardType="number-pad"
                      placeholder="e.g. 5"
                      placeholderTextColor={palette.textMuted}
                      value={customInterval}
                      onChangeText={setCustomInterval}
                      maxLength={3}
                    />
                    <Text className={`${typeface.regular} text-base`} style={{ color: palette.text }}>
                      days
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Color Palette / Theme */}
            <Text className={`text-sm ${typeface.medium} mt-8 mb-4 ml-2`} style={{ color: palette.textMuted }}>
              Theme
            </Text>

            <View className="flex-row flex-wrap gap-4 items-center mb-4">
              {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
                const themeData = THEMES[themeKey];
                const isSelected = !useCustomColor && theme === themeKey;
                return (
                  <Pressable
                    key={themeKey}
                    onPress={() => {
                      setUseCustomColor(false);
                      setTheme(themeKey);
                    }}
                    aria-label={`${themeKey} theme`}
                    role="button"
                    className="w-12 h-12 rounded-full items-center justify-center border"
                    style={{
                      backgroundColor: settings.darkMode ? themeData.darkBackground : themeData.background,
                      borderColor: isSelected ? themeData.accent : 'transparent',
                      borderWidth: isSelected ? 2 : 1,
                    }}
                  >
                    {isSelected && <Check size={18} color={themeData.accent} />}
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => setUseCustomColor(true)}
                aria-label="Custom color picker"
                role="button"
                className="w-12 h-12 rounded-full items-center justify-center border"
                style={{
                  backgroundColor: useCustomColor ? customColorHex : palette.surface,
                  borderColor: useCustomColor ? palette.text : palette.border,
                  borderWidth: useCustomColor ? 2 : 1,
                }}
              >
                {useCustomColor ? (
                  <Check size={18} color="#FFFFFF" />
                ) : (
                  <Palette size={18} color={palette.textMuted} />
                )}
              </Pressable>
            </View>

            {useCustomColor && (
              <View className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: palette.surface }}>
                <Text className={`text-xs ${typeface.medium} mb-3`} style={{ color: palette.textMuted }}>
                  Slide to pick a color
                </Text>
                <HueSlider hue={customHue} onChange={setCustomHue} />
              </View>
            )}

            {/* Hide Behind Tap / Spoiler (Remember only) */}
            {collection === 'remember' && (
              <View
                className="flex-row items-center justify-between p-4 rounded-2xl mt-4 mb-4"
                style={{ backgroundColor: palette.surface }}
              >
                <View className="flex-row items-center gap-3">
                  <EyeOff size={18} color={palette.text} />
                  <View>
                    <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                      Hide behind tap
                    </Text>
                    <Text className={`${typeface.regular} text-xs mt-0.5`} style={{ color: palette.textMuted }}>
                      Blurs this thought in the list until tapped
                    </Text>
                  </View>
                </View>
                <Switch
                  value={spoiler}
                  onValueChange={setSpoiler}
                  trackColor={{ false: '#D3D3D3', true: '#7A967A' }}
                  thumbColor="#FFFFFF"
                  aria-label="Hide this thought behind a tap"
                />
              </View>
            )}
            <View className="h-4" />
          </ScrollView>

          <View className="pt-3">
            <Pressable
              onPress={handleSave}
              aria-label="Save"
              role="button"
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: palette.text }}
            >
              <Text className={`${typeface.semibold} text-base`} style={{ color: palette.background }}>
                Save
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
