import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  LinearTransition,
} from 'react-native-reanimated';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {
  X,
  Moon,
  Sun,
  ArchiveRestore,
  Bell,
  Download,
  Upload,
  Trash2,
  Lock,
  ChevronRight,
  Cloud,
  EyeOff,
  Check,
  Image as ImageIcon,
  SlidersHorizontal,
  Palette,
  Database,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw,
  Sparkles,
  Layers,
  Brain,
  BookOpen,
  Quote,
  Zap,
  Type,
} from 'lucide-react-native';
import {
  CardLook,
  CardCorner,
  CardDensity,
  CardSpacing,
  ColorStrength,
  TextSize,
  Thought,
  LockTimeout,
  WallpaperDim,
  CARD_DENSITY,
  CARD_SPACING,
  CARD_COLOR_STRENGTH,
  CollectionId,
  COLLECTIONS,
  CollectionThemeConfig,
  AppearanceId,
  FontFamilyId,
  CardBorder,
  AppSettings,
} from '../types';
import { NEUTRAL, APP_ACCENT_PALETTES } from '../constants/theme';
import { APPEARANCE_LIST, AppearanceTokens, APPEARANCES } from '../constants/appearance';
import { TYPEFACE_LIST, TYPEFACES } from '../constants/fonts';
import { BORDER_OPTIONS } from '../constants/borders';
import { DESIGN_PRESETS, matchPreset } from '../constants/presets';
import { useSettings } from '../context/SettingsContext';
import { useAppearance } from '../hooks/useAppearance';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';
import { scheduleDailyReminder, cancelDailyReminder } from '../lib/reminders';
import { exportBackup, importBackup } from '../lib/backup';
import { pickWallpaper, clearWallpaper } from '../lib/wallpaper';
import { PinSetupMode } from './PinSetupModal';
import { useTypeface } from '../hooks/useTypeface';
import { useSync } from '../context/SyncContext';
import { SliderControl } from './SliderControl';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SettingsTab = 'general' | 'appearance' | 'sync' | 'data';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  archivedThoughts: Thought[];
  onUnarchive: (thought: Thought) => void;
  onDelete: (thought: Thought) => void;
  thoughts: Thought[];
  onImport: (thoughts: Thought[]) => void;
  onOpenPinFlow: (mode: PinSetupMode) => void;
  onOpenNotionSetup: () => void;
}

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'sync', label: 'Sync', icon: Cloud },
  { id: 'data', label: 'Data', icon: Database },
];

const COLLECTION_ICONS: Record<CollectionId, typeof Brain> = {
  remember: Brain,
  learnings: BookOpen,
  blessings: Sparkles,
  sayings: Quote,
  tryDoing: Zap,
};

const LOOK_OPTIONS: { id: CardLook; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'neon', label: 'Neon' },
  { id: 'dark', label: 'Dark' },
];

const CORNER_OPTIONS: { id: CardCorner; label: string }[] = [
  { id: 'sharp', label: 'Sharp' },
  { id: 'soft', label: 'Soft' },
  { id: 'round', label: 'Round' },
  { id: 'pill', label: 'Pill' },
];

const DENSITY_OPTIONS: { id: CardDensity; label: string }[] = (
  Object.keys(CARD_DENSITY) as CardDensity[]
).map(id => ({ id, label: CARD_DENSITY[id].label }));

const SPACING_OPTIONS: { id: CardSpacing; label: string }[] = (
  Object.keys(CARD_SPACING) as CardSpacing[]
).map(id => ({ id, label: CARD_SPACING[id].label }));

const STRENGTH_OPTIONS: { id: ColorStrength; label: string; description: string }[] = (
  Object.keys(CARD_COLOR_STRENGTH) as ColorStrength[]
).map(id => ({
  id,
  label: CARD_COLOR_STRENGTH[id].label,
  description: CARD_COLOR_STRENGTH[id].description,
}));

const TEXT_SIZE_OPTIONS: { id: TextSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const WALLPAPER_DIM_OPTIONS: { id: WallpaperDim; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'strong', label: 'Strong' },
];

const LOCK_TIMEOUT_OPTIONS: { id: LockTimeout; label: string }[] = [
  { id: 'immediate', label: 'Immediately' },
  { id: '1min', label: 'After 1 min' },
  { id: '5min', label: 'After 5 min' },
  { id: '15min', label: 'After 15 min' },
];

const SWATCH_ACCENT = '#7A967A';

function AppearanceSwatch({
  tokens,
  inverted,
  palette,
}: {
  tokens: AppearanceTokens;
  inverted: boolean;
  palette: typeof NEUTRAL.light;
}) {
  const radius = Math.min(tokens.cardRadius ?? 24, 8);
  const ink = inverted ? palette.background : palette.text;
  const accent = tokens.monochrome ? ink : SWATCH_ACCENT;
  const rowCount = tokens.id === 'compact' ? 4 : 3;

  return (
    <View
      className="w-14 items-stretch justify-center gap-1"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: rowCount }, (_, index) => (
        <View
          key={index}
          style={{
            height: tokens.id === 'compact' ? 5 : 8,
            borderRadius: radius,
            borderLeftWidth: tokens.colorExpression === 'rule' ? 2 : 0,
            borderLeftColor: accent,
            borderWidth: tokens.cardBorderWidth > 0 ? 1 : 0,
            borderColor: ink,
            opacity: tokens.translucent ? 0.55 : 1,
            backgroundColor:
              tokens.colorExpression === 'fill' ? accent : inverted ? 'rgba(255,255,255,0.18)' : palette.pillMuted,
          }}
        />
      ))}
    </View>
  );
}

function formatReminderTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

export function SettingsModal({
  visible,
  onClose,
  archivedThoughts,
  onUnarchive,
  onDelete,
  thoughts,
  onImport,
  onOpenPinFlow,
  onOpenNotionSetup,
}: SettingsModalProps) {
  const typeface = useTypeface();
  const { settings, updateSettings } = useSettings();
  const { requestSync, status: syncStatus } = useSync();
  const appearance = useAppearance();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const activePreset = matchPreset(settings);
  const { gesture, animatedStyle, overlayStyle, dismiss } = useSwipeToDismiss(onClose, visible, {
    animateIn: true,
  });

  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * 0.88);
  const insets = useSafeAreaInsets();
  const isFrosted = appearance.chromeBlur > 0;

  // Settings Sub-Tabs State
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [tabDirection, setTabDirection] = useState<number>(0);
  const [tabBarWidth, setTabBarWidth] = useState(0);

  // Appearance Scope: 'global' or a specific collection id
  const [selectedCollectionScope, setSelectedCollectionScope] = useState<CollectionId | 'global'>('global');

  // Animation values for tab content
  const contentSlideX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const indicatorX = useSharedValue(0);

  const activeTabIndex = SETTINGS_TABS.findIndex(t => t.id === activeTab);
  const tabItemWidth = tabBarWidth > 0 ? (tabBarWidth - 12) / SETTINGS_TABS.length : 0;

  useEffect(() => {
    if (tabItemWidth > 0) {
      indicatorX.value = withTiming(activeTabIndex * tabItemWidth, {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [activeTabIndex, tabItemWidth, indicatorX]);

  const handleSelectTab = (newTab: SettingsTab) => {
    if (newTab === activeTab) return;
    const prevIdx = SETTINGS_TABS.findIndex(t => t.id === activeTab);
    const nextIdx = SETTINGS_TABS.findIndex(t => t.id === newTab);
    const dir = nextIdx > prevIdx ? 1 : -1;
    setTabDirection(dir);
    setActiveTab(newTab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    contentSlideX.value = dir * 25;
    contentOpacity.value = 0.4;
    contentSlideX.value = withTiming(0, {
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    contentOpacity.value = withTiming(1, { duration: 180 });
  };

  const tabIndicatorStyle = useAnimatedStyle(() => {
    if (tabItemWidth === 0) return { opacity: 0 };
    return {
      width: tabItemWidth,
      transform: [{ translateX: indicatorX.value }],
      opacity: 1,
    };
  });

  const tabContentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: contentSlideX.value }],
    opacity: contentOpacity.value,
  }));

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [visible, dismiss]);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const openPinFlow = (mode: PinSetupMode) => {
    onClose();
    onOpenPinFlow(mode);
  };

  const chooseWallpaper = async () => {
    try {
      const uri = await pickWallpaper();
      if (uri) updateSettings({ wallpaperUri: uri });
    } catch {
      Alert.alert('Could not set background', 'That image could not be read. Try another one.');
    }
  };

  const removeWallpaper = () => {
    clearWallpaper();
    updateSettings({ wallpaperUri: undefined });
  };

  const openNotionSetup = () => {
    onClose();
    onOpenNotionSetup();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportBackup(thoughts);
    } catch (e) {
      Alert.alert('Export failed', 'Could not create the backup file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const imported = await importBackup();
      if (!imported) return;
      Alert.alert(
        'Restore backup',
        `This will replace all ${thoughts.length} current thoughts with ${imported.length} from the backup. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: () => onImport(imported) },
        ]
      );
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Could not read that file.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      const granted = await scheduleDailyReminder(settings.reminderTime);
      if (!granted) {
        Alert.alert(
          'Notifications disabled',
          'Enable notification permission for Remember in system settings to get a daily reminder.'
        );
        return;
      }
    } else {
      await cancelDailyReminder();
    }
    updateSettings({ reminderEnabled: value });
  };

  const openTimePicker = () => {
    const [hour, minute] = settings.reminderTime.split(':').map(Number);
    const initial = new Date();
    initial.setHours(hour, minute, 0, 0);

    DateTimePickerAndroid.open({
      value: initial,
      mode: 'time',
      is24Hour: false,
      onChange: (_event, selected) => {
        if (!selected) return;
        const time = `${selected.getHours().toString().padStart(2, '0')}:${selected
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;
        updateSettings({ reminderTime: time });
        if (settings.reminderEnabled) {
          scheduleDailyReminder(time);
        }
      },
    });
  };

  // Reorder tabs helpers
  const currentTabOrder: CollectionId[] =
    settings.collectionOrder && settings.collectionOrder.length === COLLECTIONS.length
      ? settings.collectionOrder
      : ['remember', 'learnings', 'blessings', 'sayings', 'tryDoing'];

  const moveTab = (index: number, direction: -1 | 1) => {
    const newOrder = [...currentTabOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ collectionOrder: newOrder });
  };

  const resetTabOrder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateSettings({ collectionOrder: ['remember', 'learnings', 'blessings', 'sayings', 'tryDoing'] });
  };

  // Per-collection appearance config helpers
  const isCustomizingSpecificCollection = selectedCollectionScope !== 'global';
  const currentCollectionTheme: CollectionThemeConfig = isCustomizingSpecificCollection
    ? settings.collectionThemes?.[selectedCollectionScope] ?? {}
    : {};

  const updateSelectedScopeTheme = (patch: Partial<CollectionThemeConfig>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isCustomizingSpecificCollection) {
      // Global updates
      updateSettings(patch as Partial<AppSettings>);
    } else {
      // Per-collection updates
      const existing = settings.collectionThemes ?? {};
      const targetCol = selectedCollectionScope as CollectionId;
      const updated = { ...(existing[targetCol] ?? {}), ...patch };
      updateSettings({
        collectionThemes: {
          ...existing,
          [targetCol]: updated,
        },
      });
    }
  };

  const resetSelectedScopeTheme = () => {
    if (!isCustomizingSpecificCollection) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const existing = { ...(settings.collectionThemes ?? {}) };
    delete existing[selectedCollectionScope as CollectionId];
    updateSettings({ collectionThemes: existing });
  };

  const activeAppearanceId: AppearanceId = isCustomizingSpecificCollection
    ? currentCollectionTheme.appearance ?? settings.appearance
    : settings.appearance;

  const activeFontFamily: FontFamilyId = isCustomizingSpecificCollection
    ? currentCollectionTheme.fontFamily ?? settings.fontFamily
    : settings.fontFamily;

  const activeCardBorder: CardBorder = isCustomizingSpecificCollection
    ? currentCollectionTheme.cardBorder ?? settings.cardBorder
    : settings.cardBorder;

  const activeCardCorner: CardCorner = isCustomizingSpecificCollection
    ? currentCollectionTheme.cardCorner ?? settings.cardCorner
    : settings.cardCorner;

  const activeCustomCornerRadius: number =
    (isCustomizingSpecificCollection
      ? currentCollectionTheme.customCornerRadius ?? settings.customCornerRadius
      : settings.customCornerRadius) ?? 24;

  const activeCardLook: CardLook = isCustomizingSpecificCollection
    ? currentCollectionTheme.cardLook ?? settings.cardLook
    : settings.cardLook;

  const activeCardDensity: CardDensity = isCustomizingSpecificCollection
    ? currentCollectionTheme.cardDensity ?? settings.cardDensity
    : settings.cardDensity;

  const activeCustomCardPaddingY: number =
    (isCustomizingSpecificCollection
      ? currentCollectionTheme.customCardPaddingY ?? settings.customCardPaddingY
      : settings.customCardPaddingY) ?? 18;

  const activeCustomCardDensity: number =
    (isCustomizingSpecificCollection
      ? currentCollectionTheme.customCardDensity ?? settings.customCardDensity
      : settings.customCardDensity) ?? 1.0;

  const activeCardSpacing: CardSpacing = isCustomizingSpecificCollection
    ? currentCollectionTheme.cardSpacing ?? settings.cardSpacing
    : settings.cardSpacing;

  const activeColorStrength: ColorStrength = isCustomizingSpecificCollection
    ? currentCollectionTheme.colorStrength ?? settings.colorStrength
    : settings.colorStrength;

  const activeFontSizeScale: number =
    (isCustomizingSpecificCollection
      ? currentCollectionTheme.fontSizeScale ?? settings.fontSizeScale
      : settings.fontSizeScale) ?? 1.0;

  const activeGeneralThemeColor: string =
    (isCustomizingSpecificCollection
      ? currentCollectionTheme.generalThemeColor ?? settings.generalThemeColor
      : settings.generalThemeColor) ?? '#7A967A';

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} className="justify-end">
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, overlayStyle]}
        className="bg-black/25"
        onPress={dismiss}
        aria-label="Close settings"
        role="button"
      />
      <Animated.View
        className="shadow-2xl overflow-hidden"
        style={[
          {
            height: sheetHeight,
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
                    ? 'rgba(22,22,22,0.88)'
                    : 'rgba(255,255,255,0.86)',
                },
              ]}
              pointerEvents="none"
            />
          </>
        )}

        <View className="flex-1">
          {/* Header */}
          <GestureDetector gesture={gesture}>
            <View className="px-6 pt-4 pb-2">
              <View className="items-center mb-3">
                <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: palette.border }} />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className={`text-xl ${typeface.semibold}`} style={{ color: palette.text }}>
                  Settings
                </Text>
                <Pressable
                  onPress={dismiss}
                  aria-label="Close settings"
                  role="button"
                  className="w-8 h-8 rounded-full items-center justify-center -mr-1"
                  style={{ backgroundColor: palette.pillMuted }}
                >
                  <X size={18} color={palette.text} />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          {/* Main Scrollable Content Area */}
          <Animated.View style={[{ flex: 1 }, tabContentAnimatedStyle]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24 }}
            >
              {/* ========================================================================= */}
              {/* TAB 1: GENERAL */}
              {/* ========================================================================= */}
              {activeTab === 'general' && (
                <View className="gap-5">
                  {/* Tab Order & Navigation */}
                  <View>
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Layers size={16} color={palette.text} />
                        <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.text }}>
                          Bottom Tab Order
                        </Text>
                      </View>
                      <Pressable
                        onPress={resetTabOrder}
                        aria-label="Reset tab order to default"
                        role="button"
                        className="flex-row items-center gap-1 px-2.5 py-1 rounded-full border"
                        style={{ borderColor: palette.border, backgroundColor: palette.surface }}
                      >
                        <RotateCcw size={12} color={palette.textMuted} />
                        <Text className={`text-xs ${typeface.medium}`} style={{ color: palette.textMuted }}>
                          Reset
                        </Text>
                      </Pressable>
                    </View>
                    <Text className={`text-xs ${typeface.regular} mb-3`} style={{ color: palette.textMuted }}>
                      Reorder the sequence of tabs in the bottom navigation bar.
                    </Text>

                    <View className="gap-2">
                      {currentTabOrder.map((colId, index) => {
                        const colMeta = COLLECTIONS.find(c => c.id === colId);
                        const IconComp = COLLECTION_ICONS[colId];
                        const isFirst = index === 0;
                        const isLast = index === currentTabOrder.length - 1;

                        return (
                          <Animated.View
                            key={colId}
                            layout={LinearTransition.duration(240)}
                            className="flex-row items-center justify-between p-3.5 rounded-2xl border"
                            style={{
                              backgroundColor: palette.surface,
                              borderColor: palette.border,
                            }}
                          >
                            <View className="flex-row items-center gap-3">
                              <View
                                className="w-6 h-6 rounded-full items-center justify-center"
                                style={{ backgroundColor: palette.pillMuted }}
                              >
                                <Text className={`text-[11px] ${typeface.semibold}`} style={{ color: palette.textMuted }}>
                                  {index + 1}
                                </Text>
                              </View>
                              <IconComp size={16} color={palette.text} />
                              <Text className={`${typeface.medium} text-sm`} style={{ color: palette.text }}>
                                {colMeta?.label ?? colId}
                              </Text>
                            </View>

                            <View className="flex-row items-center gap-1.5">
                              <Pressable
                                onPress={() => moveTab(index, -1)}
                                disabled={isFirst}
                                aria-label={`Move ${colMeta?.label} up`}
                                role="button"
                                className="w-8 h-8 rounded-full items-center justify-center border"
                                style={{
                                  borderColor: isFirst ? 'transparent' : palette.border,
                                  backgroundColor: isFirst ? 'transparent' : palette.pillMuted,
                                  opacity: isFirst ? 0.3 : 1,
                                }}
                              >
                                <ArrowUp size={14} color={palette.text} />
                              </Pressable>
                              <Pressable
                                onPress={() => moveTab(index, 1)}
                                disabled={isLast}
                                aria-label={`Move ${colMeta?.label} down`}
                                role="button"
                                className="w-8 h-8 rounded-full items-center justify-center border"
                                style={{
                                  borderColor: isLast ? 'transparent' : palette.border,
                                  backgroundColor: isLast ? 'transparent' : palette.pillMuted,
                                  opacity: isLast ? 0.3 : 1,
                                }}
                              >
                                <ArrowDown size={14} color={palette.text} />
                              </Pressable>
                            </View>
                          </Animated.View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Daily Reminder */}
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-3`} style={{ color: palette.text }}>
                      Notifications
                    </Text>
                    <View
                      className="flex-row items-center justify-between p-4 rounded-2xl"
                      style={{ backgroundColor: palette.surface }}
                    >
                      <View className="flex-row items-center gap-3">
                        <Bell size={18} color={palette.text} />
                        <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                          Daily reminder
                        </Text>
                      </View>
                      <Switch
                        value={settings.reminderEnabled}
                        onValueChange={handleReminderToggle}
                        trackColor={{ false: '#D3D3D3', true: '#7A967A' }}
                        thumbColor="#FFFFFF"
                        aria-label="Toggle daily reminder"
                      />
                    </View>

                    {settings.reminderEnabled && (
                      <Pressable
                        onPress={openTimePicker}
                        aria-label={`Reminder time: ${formatReminderTime(settings.reminderTime)}. Change time`}
                        role="button"
                        className="flex-row items-center justify-between p-4 rounded-2xl mt-2"
                        style={{ backgroundColor: palette.surface }}
                      >
                        <Text className={`${typeface.medium} text-base ml-8`} style={{ color: palette.textMuted }}>
                          Remind me at
                        </Text>
                        <Text className={`${typeface.semibold} text-base`} style={{ color: palette.text }}>
                          {formatReminderTime(settings.reminderTime)}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Security & Privacy */}
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-3`} style={{ color: palette.text }}>
                      Security & Privacy
                    </Text>

                    <Pressable
                      onPress={() => {
                        if (settings.pinEnabled) {
                          Alert.alert('App Lock', 'Manage your PIN security', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Change PIN', onPress: () => openPinFlow('change') },
                            { text: 'Turn off PIN', style: 'destructive', onPress: () => openPinFlow('remove') },
                          ]);
                        } else {
                          openPinFlow('set');
                        }
                      }}
                      aria-label={settings.pinEnabled ? 'App lock is on. Manage PIN' : 'App lock is off. Set a PIN'}
                      role="button"
                      className="flex-row items-center justify-between p-4 rounded-2xl"
                      style={{ backgroundColor: palette.surface }}
                    >
                      <View className="flex-row items-center gap-3">
                        <Lock size={18} color={palette.text} />
                        <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                          App lock
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className={`${typeface.regular} text-sm`} style={{ color: palette.textMuted }}>
                          {settings.pinEnabled ? 'On' : 'Off'}
                        </Text>
                        <ChevronRight size={18} color={palette.textMuted} />
                      </View>
                    </Pressable>

                    {settings.pinEnabled && (
                      <View className="mt-3">
                        <Text className={`text-xs ${typeface.medium} mb-2 ml-2`} style={{ color: palette.textMuted }}>
                          Require PIN after leaving app
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {LOCK_TIMEOUT_OPTIONS.map(opt => (
                            <Pressable
                              key={opt.id}
                              onPress={() => updateSettings({ lockTimeout: opt.id })}
                              aria-label={`Lock ${opt.label}`}
                              role="button"
                              className="px-3.5 py-2.5 rounded-full border"
                              style={{
                                backgroundColor: settings.lockTimeout === opt.id ? palette.text : 'transparent',
                                borderColor: settings.lockTimeout === opt.id ? palette.text : palette.border,
                              }}
                            >
                              <Text
                                className={`text-xs ${typeface.medium}`}
                                style={{ color: settings.lockTimeout === opt.id ? palette.background : palette.text }}
                              >
                                {opt.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    <View
                      className="p-4 rounded-2xl mt-3"
                      style={{ backgroundColor: palette.surface }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1 mr-3">
                          <EyeOff size={18} color={palette.text} />
                          <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                            Hide in app switcher
                          </Text>
                        </View>
                        <Switch
                          value={settings.privacyScreen}
                          onValueChange={(value) => updateSettings({ privacyScreen: value })}
                          trackColor={{ false: '#D3D3D3', true: '#7A967A' }}
                          thumbColor="#FFFFFF"
                          aria-label="Toggle hiding app content in the recents switcher"
                        />
                      </View>
                      <Text className={`${typeface.regular} text-xs mt-2 ml-8`} style={{ color: palette.textMuted }}>
                        Blanks preview thumbnail in recent apps and secures against screenshots.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: APPEARANCE */}
              {/* ========================================================================= */}
              {activeTab === 'appearance' && (
                <View className="gap-6">
                  {/* Scope Selector: Integrated Vertical Layout */}
                  <View
                    className="p-4 rounded-2xl border"
                    style={{
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.text }}>
                        Customize Scope
                      </Text>
                      {isCustomizingSpecificCollection && settings.collectionThemes?.[selectedCollectionScope as CollectionId] && (
                        <Pressable
                          onPress={resetSelectedScopeTheme}
                          className="px-2.5 py-1 rounded-full border"
                          style={{ borderColor: palette.border, backgroundColor: palette.pillMuted }}
                        >
                          <Text className={`text-[11px] ${typeface.medium}`} style={{ color: palette.textMuted }}>
                            Reset to global
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    <Text className={`text-xs ${typeface.regular} mb-3`} style={{ color: palette.textMuted }}>
                      Apply styling globally across all pages, or choose a specific collection tab to override.
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                      <Pressable
                        onPress={() => setSelectedCollectionScope('global')}
                        className="px-3.5 py-2 rounded-full border flex-row items-center gap-1.5"
                        style={{
                          backgroundColor: selectedCollectionScope === 'global' ? activeGeneralThemeColor : palette.pillMuted,
                          borderColor: selectedCollectionScope === 'global' ? activeGeneralThemeColor : palette.border,
                        }}
                      >
                        <Sparkles
                          size={13}
                          color={selectedCollectionScope === 'global' ? '#FFFFFF' : palette.text}
                        />
                        <Text
                          className={`text-xs ${selectedCollectionScope === 'global' ? typeface.semibold : typeface.medium}`}
                          style={{
                            color: selectedCollectionScope === 'global' ? '#FFFFFF' : palette.text,
                          }}
                        >
                          All Tabs (Global)
                        </Text>
                      </Pressable>

                      {COLLECTIONS.map(item => {
                        const isSelected = selectedCollectionScope === item.id;
                        const hasCustomTheme = Boolean(settings.collectionThemes?.[item.id]);
                        const IconComp = COLLECTION_ICONS[item.id];

                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => setSelectedCollectionScope(item.id)}
                            className="px-3 py-2 rounded-full border flex-row items-center gap-1.5"
                            style={{
                              backgroundColor: isSelected ? activeGeneralThemeColor : palette.pillMuted,
                              borderColor: isSelected ? activeGeneralThemeColor : hasCustomTheme ? activeGeneralThemeColor : palette.border,
                            }}
                          >
                            <IconComp
                              size={13}
                              color={isSelected ? '#FFFFFF' : palette.text}
                            />
                            <Text
                              className={`text-xs ${isSelected ? typeface.semibold : typeface.medium}`}
                              style={{
                                color: isSelected ? '#FFFFFF' : palette.text,
                              }}
                            >
                              {item.label}
                            </Text>
                            {hasCustomTheme && !isSelected && (
                              <View
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: activeGeneralThemeColor }}
                              />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Grouped Theme & Dark Mode Card */}
                  {!isCustomizingSpecificCollection && (
                    <View
                      className="p-4 rounded-2xl border gap-4"
                      style={{
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                      }}
                    >
                      {/* Dark Mode Switch */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          {settings.darkMode ? (
                            <Moon size={18} color={palette.text} />
                          ) : (
                            <Sun size={18} color={palette.text} />
                          )}
                          <View>
                            <Text className={`${typeface.semibold} text-base`} style={{ color: palette.text }}>
                              Dark Mode
                            </Text>
                            <Text className={`${typeface.regular} text-xs`} style={{ color: palette.textMuted }}>
                              {settings.darkMode ? 'Dark canvas with muted contrast' : 'Clean light paper canvas'}
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={settings.darkMode}
                          onValueChange={(value) => updateSettings({ darkMode: value })}
                          trackColor={{ false: '#D3D3D3', true: activeGeneralThemeColor }}
                          thumbColor="#FFFFFF"
                          aria-label="Toggle dark mode"
                        />
                      </View>

                      <View className="h-px" style={{ backgroundColor: palette.border }} />

                      {/* General Accent Theme Color */}
                      <View>
                        <View className="flex-row items-center justify-between mb-1.5">
                          <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.text }}>
                            General Accent Color
                          </Text>
                          <View
                            className="w-5 h-5 rounded-full border border-black/10"
                            style={{ backgroundColor: activeGeneralThemeColor }}
                          />
                        </View>
                        <Text className={`text-xs ${typeface.regular} mb-3`} style={{ color: palette.textMuted }}>
                          Colors active bottom tabs, badges, primary buttons, and chrome.
                        </Text>

                        {/* Palette Swatches */}
                        <View className="flex-row flex-wrap gap-2.5">
                          {APP_ACCENT_PALETTES.map((pal) => {
                            const isChosen = activeGeneralThemeColor.toLowerCase() === pal.color.toLowerCase();
                            return (
                              <Pressable
                                key={pal.id}
                                onPress={() => updateSelectedScopeTheme({ generalThemeColor: pal.color })}
                                aria-label={`Select ${pal.label} accent color`}
                                role="button"
                                className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
                                style={{
                                  backgroundColor: isChosen
                                    ? settings.darkMode
                                      ? 'rgba(255,255,255,0.12)'
                                      : 'rgba(0,0,0,0.06)'
                                    : 'transparent',
                                  borderColor: isChosen ? pal.color : palette.border,
                                }}
                              >
                                <View
                                  className="w-4 h-4 rounded-full items-center justify-center"
                                  style={{ backgroundColor: pal.color }}
                                >
                                  {isChosen && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                </View>
                                <Text
                                  className={`text-xs ${isChosen ? typeface.semibold : typeface.medium}`}
                                  style={{ color: isChosen ? palette.text : palette.textMuted }}
                                >
                                  {pal.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Typeface Selector & Font Size Slider */}
                  <View
                    className="p-4 rounded-2xl border gap-4"
                    style={{
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                    }}
                  >
                    <View>
                      <Text className={`text-sm ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
                        Typeface & Font Scaling
                      </Text>
                      <Text className={`text-xs ${typeface.regular} mb-3`} style={{ color: palette.textMuted }}>
                        Choose typography personality and scale overall readability.
                      </Text>

                      {/* Font List */}
                      <View className="gap-2 mb-4">
                        {TYPEFACE_LIST.map(opt => {
                          const isActive = activeFontFamily === opt.id;
                          return (
                            <Pressable
                              key={opt.id}
                              onPress={() => updateSelectedScopeTheme({ fontFamily: opt.id })}
                              aria-label={`Typeface: ${opt.label}. ${opt.description}`}
                              role="radio"
                              aria-checked={isActive}
                              className="flex-row items-center justify-between rounded-xl p-3 border"
                              style={{
                                backgroundColor: isActive
                                  ? settings.darkMode
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.04)'
                                  : 'transparent',
                                borderColor: isActive ? activeGeneralThemeColor : palette.border,
                              }}
                            >
                              <View className="flex-1 pr-3">
                                <Text className={`text-base ${opt.sampleClass}`} style={{ color: palette.text }}>
                                  {opt.label}
                                </Text>
                                <Text className={`text-xs ${typeface.regular} mt-0.5`} style={{ color: palette.textMuted }}>
                                  {opt.description}
                                </Text>
                              </View>
                              {isActive && (
                                <View
                                  className="w-6 h-6 rounded-full items-center justify-center"
                                  style={{ backgroundColor: activeGeneralThemeColor }}
                                >
                                  <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Font Size Slider */}
                      <SliderControl
                        label="Font Size Scale"
                        value={activeFontSizeScale}
                        min={0.85}
                        max={1.35}
                        step={0.05}
                        valueDisplay={(v) => `${Math.round(v * 100)}% (Default 100%)`}
                        leftLabel="A- (85%)"
                        rightLabel="A+ (135%)"
                        description="Scale thought text and font sizing across the app."
                        accentColor={activeGeneralThemeColor}
                        onChange={(val) => updateSelectedScopeTheme({ fontSizeScale: val })}
                      />

                      {/* Live Typography Preview */}
                      <View
                        className="p-3.5 rounded-xl border mt-2"
                        style={{
                          backgroundColor: palette.pillMuted,
                          borderColor: palette.border,
                        }}
                      >
                        <Text className={`text-[11px] ${typeface.medium} uppercase tracking-wider mb-1`} style={{ color: palette.textMuted }}>
                          Live Preview
                        </Text>
                        <Text
                          className={`${TYPEFACES[activeFontFamily]?.classes.regular ?? 'font-inter'}`}
                          style={{
                            color: palette.text,
                            fontSize: Math.round(16 * activeFontSizeScale),
                            lineHeight: Math.round(24 * activeFontSizeScale),
                          }}
                        >
                          "Simplicity is the prerequisite for reliability."
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Geometry Sliders (Corner Radius, Card Height & Padding, Density) */}
                  <View
                    className="p-4 rounded-2xl border"
                    style={{
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                    }}
                  >
                    <Text className={`text-sm ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
                      Card Geometry & Spacing
                    </Text>
                    <Text className={`text-xs ${typeface.regular} mb-4`} style={{ color: palette.textMuted }}>
                      Fine-tune corner curves, row height, and feeding density.
                    </Text>

                    {/* Corner Radius Slider */}
                    <SliderControl
                      label="Corner Roundedness"
                      value={activeCustomCornerRadius}
                      min={0}
                      max={32}
                      step={2}
                      valueDisplay={(v) => `${v}px (${v === 0 ? 'Sharp' : v <= 12 ? 'Soft' : v <= 24 ? 'Round' : 'Pill'})`}
                      leftLabel="Sharp (0px)"
                      rightLabel="Pill (32px)"
                      description="Adjust card border radius."
                      accentColor={activeGeneralThemeColor}
                      onChange={(val) => updateSelectedScopeTheme({ customCornerRadius: val })}
                    />

                    {/* Card Height & Padding Slider */}
                    <SliderControl
                      label="Card Height & Padding"
                      value={activeCustomCardPaddingY}
                      min={8}
                      max={32}
                      step={2}
                      valueDisplay={(v) => `${v}px`}
                      leftLabel="Compact (8px)"
                      rightLabel="Spacious (32px)"
                      description="Adjust vertical breathing room inside each thought card."
                      accentColor={activeGeneralThemeColor}
                      onChange={(val) => updateSelectedScopeTheme({ customCardPaddingY: val })}
                    />

                    {/* Card Spacing Multiplier Slider */}
                    <SliderControl
                      label="Card Spacing & Gap"
                      value={activeCustomCardDensity}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      valueDisplay={(v) => `${v.toFixed(1)}x`}
                      leftLabel="Tight (0.5x)"
                      rightLabel="Wide (2.0x)"
                      description="Adjust distance between thought cards in the daily list."
                      accentColor={activeGeneralThemeColor}
                      onChange={(val) => updateSelectedScopeTheme({ customCardDensity: val })}
                    />

                    {/* Mini Card Geometry Preview */}
                    <View
                      className="p-3 border mt-2 items-center justify-center"
                      style={{
                        backgroundColor: palette.pillMuted,
                        borderColor: palette.border,
                        borderRadius: activeCustomCornerRadius,
                        paddingVertical: activeCustomCardPaddingY,
                      }}
                    >
                      <Text
                        className={`text-xs ${typeface.medium}`}
                        style={{ color: palette.text }}
                      >
                        Sample Card Surface ({activeCustomCornerRadius}px radius · {activeCustomCardPaddingY}px pad)
                      </Text>
                    </View>
                  </View>

                  {/* Appearance Presets */}
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
                      Appearance Look Presets
                    </Text>
                    <Text className={`text-xs ${typeface.regular} mb-3`} style={{ color: palette.textMuted }}>
                      Overall card material, surface opacity, and elevation.
                    </Text>
                    <View className="gap-2">
                      {APPEARANCE_LIST.map(opt => {
                        const isActive = activeAppearanceId === opt.id;
                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => updateSelectedScopeTheme({ appearance: opt.id })}
                            aria-label={`Appearance: ${opt.label}. ${opt.description}`}
                            role="radio"
                            aria-checked={isActive}
                            className="flex-row items-center justify-between p-3.5 rounded-2xl border"
                            style={{
                              backgroundColor: isActive ? palette.text : palette.surface,
                              borderColor: isActive ? palette.text : palette.border,
                            }}
                          >
                            <View className="flex-1 mr-3">
                              <Text
                                className={`${typeface.medium} text-base`}
                                style={{ color: isActive ? palette.background : palette.text }}
                              >
                                {opt.label}
                              </Text>
                              <Text
                                className={`${typeface.regular} text-xs mt-0.5`}
                                style={{ color: isActive ? palette.background : palette.textMuted, opacity: isActive ? 0.7 : 1 }}
                              >
                                {opt.description}
                              </Text>
                            </View>
                            <AppearanceSwatch tokens={opt} inverted={isActive} palette={palette} />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Card Border Options */}
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
                      Card Border Styling
                    </Text>
                    <View className="gap-2 mt-2">
                      {BORDER_OPTIONS.map(opt => {
                        const isActive = activeCardBorder === opt.id;
                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => updateSelectedScopeTheme({ cardBorder: opt.id })}
                            aria-label={`Card border: ${opt.label}`}
                            role="radio"
                            aria-checked={isActive}
                            className="flex-row items-center justify-between rounded-2xl p-3.5 border"
                            style={{
                              backgroundColor: isActive ? palette.pillMuted : 'transparent',
                              borderColor: isActive ? activeGeneralThemeColor : palette.border,
                            }}
                          >
                            <View className="flex-1 pr-3">
                              <Text className={`text-sm ${typeface.medium}`} style={{ color: palette.text }}>
                                {opt.label}
                              </Text>
                            </View>
                            {isActive && <Check size={16} color={activeGeneralThemeColor} strokeWidth={2.5} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Color Strength Preset */}
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
                      Card Color Strength
                    </Text>
                    <Text className={`text-xs ${typeface.regular} mb-3`} style={{ color: palette.textMuted }}>
                      How boldly thought colors tint each card.
                    </Text>
                    <View className="flex-row flex-wrap gap-2.5">
                      {(['muted', 'soft', 'bold', 'vivid'] as const).map(strengthKey => {
                        const isSelected = activeColorStrength === strengthKey;
                        const opt = CARD_COLOR_STRENGTH[strengthKey];
                        return (
                          <Pressable
                            key={strengthKey}
                            onPress={() => updateSelectedScopeTheme({ colorStrength: strengthKey })}
                            aria-label={`Color strength: ${opt.label}`}
                            role="button"
                            className="px-3.5 py-2.5 rounded-full border"
                            style={{
                              backgroundColor: isSelected ? palette.text : 'transparent',
                              borderColor: isSelected ? palette.text : palette.border,
                            }}
                          >
                            <Text
                              className={`text-xs ${typeface.medium}`}
                              style={{ color: isSelected ? palette.background : palette.text }}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Wallpaper Background (Global only) */}
                  {!isCustomizingSpecificCollection && (
                    <View>
                      <Text className={`text-sm ${typeface.semibold} mb-3`} style={{ color: palette.text }}>
                        Wallpaper Background
                      </Text>
                      <Pressable
                        onPress={chooseWallpaper}
                        className="flex-row items-center justify-between p-4 rounded-2xl"
                        style={{ backgroundColor: palette.surface }}
                      >
                        <View className="flex-row items-center gap-3">
                          <ImageIcon size={18} color={palette.text} />
                          <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                            {settings.wallpaperUri ? 'Change image' : 'Choose from gallery'}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={palette.textMuted} />
                      </Pressable>

                      {settings.wallpaperUri && (
                        <View className="mt-3">
                          <View className="flex-row flex-wrap gap-2">
                            {WALLPAPER_DIM_OPTIONS.map(opt => (
                              <Pressable
                                key={opt.id}
                                onPress={() => updateSettings({ wallpaperDim: opt.id })}
                                className="px-3.5 py-2 rounded-full border"
                                style={{
                                  backgroundColor: settings.wallpaperDim === opt.id ? palette.text : 'transparent',
                                  borderColor: settings.wallpaperDim === opt.id ? palette.text : palette.border,
                                }}
                              >
                                <Text
                                  className={`text-xs ${typeface.medium}`}
                                  style={{ color: settings.wallpaperDim === opt.id ? palette.background : palette.text }}
                                >
                                  {opt.label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                          <Pressable
                            onPress={removeWallpaper}
                            className="p-3 rounded-xl mt-3 items-center border"
                            style={{ borderColor: palette.border, backgroundColor: palette.surface }}
                          >
                            <Text className={`${typeface.medium} text-sm`} style={{ color: '#C25B5B' }}>
                              Remove background
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: SYNC */}
              {/* ========================================================================= */}
              {activeTab === 'sync' && (
                <View className="gap-5">
                  <View
                    className="p-4 rounded-2xl border"
                    style={{
                      backgroundColor: palette.surface,
                      borderColor: settings.notionEnabled ? '#7A967A' : palette.border,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2.5">
                        <Cloud size={20} color={settings.notionEnabled ? '#7A967A' : palette.text} />
                        <Text className={`text-base ${typeface.semibold}`} style={{ color: palette.text }}>
                          Notion Integration
                        </Text>
                      </View>
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: settings.notionEnabled
                            ? 'rgba(122, 150, 122, 0.2)'
                            : palette.pillMuted,
                        }}
                      >
                        <Text
                          className={`text-xs ${typeface.semibold}`}
                          style={{ color: settings.notionEnabled ? '#5D7A5D' : palette.textMuted }}
                        >
                          {settings.notionEnabled ? 'Connected' : 'Not connected'}
                        </Text>
                      </View>
                    </View>

                    <Text className={`text-xs ${typeface.regular} mb-4`} style={{ color: palette.textMuted }}>
                      Seamless two-way offline-first sync across all 5 life collections and dedicated Notion databases.
                    </Text>

                    <Pressable
                      onPress={openNotionSetup}
                      aria-label="Open Notion setup modal"
                      role="button"
                      className="p-3.5 rounded-xl items-center justify-center flex-row gap-2"
                      style={{ backgroundColor: palette.text }}
                    >
                      <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.background }}>
                        {settings.notionEnabled ? 'Manage Notion Databases' : 'Connect Notion'}
                      </Text>
                      <ChevronRight size={16} color={palette.background} />
                    </Pressable>
                  </View>

                  {/* 5 Collections Databases Status */}
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-3`} style={{ color: palette.text }}>
                      Collection Database Mappings
                    </Text>
                    <View className="gap-2">
                      {COLLECTIONS.map(col => {
                        const IconComp = COLLECTION_ICONS[col.id];
                        const isMapped = Boolean(settings.notionDatabaseIds?.[col.id]);

                        return (
                          <View
                            key={col.id}
                            className="flex-row items-center justify-between p-3.5 rounded-xl border"
                            style={{ backgroundColor: palette.surface, borderColor: palette.border }}
                          >
                            <View className="flex-row items-center gap-2.5">
                              <IconComp size={16} color={palette.text} />
                              <Text className={`${typeface.medium} text-sm`} style={{ color: palette.text }}>
                                {col.label}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-1.5">
                              {isMapped ? (
                                <View className="flex-row items-center gap-1">
                                  <Check size={14} color="#7A967A" />
                                  <Text className={`text-xs ${typeface.medium}`} style={{ color: '#7A967A' }}>
                                    Mapped
                                  </Text>
                                </View>
                              ) : (
                                <Text className={`text-xs ${typeface.regular}`} style={{ color: palette.textMuted }}>
                                  Not linked
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Manual Sync Trigger */}
                  {settings.notionEnabled && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        requestSync();
                      }}
                      className="flex-row items-center justify-center gap-2 p-3.5 rounded-xl border"
                      style={{ borderColor: palette.border, backgroundColor: palette.surface }}
                    >
                      <RefreshCw size={15} color={palette.text} />
                      <Text className={`${typeface.semibold} text-sm`} style={{ color: palette.text }}>
                        {syncStatus === 'syncing' ? 'Syncing now…' : 'Sync Now'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: DATA & BACKUPS */}
              {/* ========================================================================= */}
              {activeTab === 'data' && (
                <View className="gap-5">
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-3`} style={{ color: palette.text }}>
                      Backup & Export
                    </Text>
                    <View className="gap-2">
                      <Pressable
                        onPress={handleExport}
                        disabled={isExporting || thoughts.length === 0}
                        aria-label="Export backup as JSON file"
                        role="button"
                        className="flex-row items-center gap-3 p-4 rounded-2xl"
                        style={{ backgroundColor: palette.surface, opacity: isExporting || thoughts.length === 0 ? 0.5 : 1 }}
                      >
                        <Download size={18} color={palette.text} />
                        <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                          {isExporting ? 'Preparing…' : 'Export JSON backup'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleImport}
                        disabled={isImporting}
                        aria-label="Import backup from JSON file"
                        role="button"
                        className="flex-row items-center gap-3 p-4 rounded-2xl"
                        style={{ backgroundColor: palette.surface, opacity: isImporting ? 0.5 : 1 }}
                      >
                        <Upload size={18} color={palette.text} />
                        <Text className={`${typeface.medium} text-base`} style={{ color: palette.text }}>
                          {isImporting ? 'Reading…' : 'Import JSON backup'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Archived Thoughts */}
                  <View>
                    <Text className={`text-sm ${typeface.semibold} mb-3`} style={{ color: palette.text }}>
                      Archived Thoughts ({archivedThoughts.length})
                    </Text>
                    {archivedThoughts.length === 0 ? (
                      <View className="p-4 rounded-2xl items-center justify-center" style={{ backgroundColor: palette.surface }}>
                        <Text className={`text-xs ${typeface.regular}`} style={{ color: palette.textMuted }}>
                          No archived thoughts. Swipe left on any note to pause it.
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-2">
                        {archivedThoughts.map(thought => (
                          <View
                            key={thought.id}
                            className="flex-row items-center justify-between p-3.5 rounded-2xl"
                            style={{ backgroundColor: palette.surface }}
                          >
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              className={`flex-1 mr-3 ${typeface.regular} text-sm`}
                              style={{ color: palette.text }}
                            >
                              {thought.content}
                            </Text>
                            <View className="flex-row items-center gap-3">
                              <Pressable
                                onPress={() => onUnarchive(thought)}
                                aria-label={`Restore: ${thought.content}`}
                                role="button"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <ArchiveRestore size={18} color={palette.textMuted} />
                              </Pressable>
                              <Pressable
                                onPress={() =>
                                  Alert.alert(
                                    'Delete thought',
                                    'This will permanently delete this thought. This cannot be undone.',
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      { text: 'Delete', style: 'destructive', onPress: () => onDelete(thought) },
                                    ]
                                  )
                                }
                                aria-label={`Delete: ${thought.content}`}
                                role="button"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Trash2 size={18} color="#C0554A" />
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* App Stats */}
                  <View className="p-4 rounded-2xl border" style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
                    <Text className={`text-xs ${typeface.semibold} mb-2`} style={{ color: palette.textMuted }}>
                      APP STATISTICS
                    </Text>
                    <View className="flex-row items-center justify-between py-1">
                      <Text className={`text-xs ${typeface.regular}`} style={{ color: palette.textMuted }}>Total Thoughts</Text>
                      <Text className={`text-xs ${typeface.semibold}`} style={{ color: palette.text }}>{thoughts.length}</Text>
                    </View>
                    <View className="flex-row items-center justify-between py-1">
                      <Text className={`text-xs ${typeface.regular}`} style={{ color: palette.textMuted }}>Active Thoughts</Text>
                      <Text className={`text-xs ${typeface.semibold}`} style={{ color: palette.text }}>{thoughts.filter(t => !t.archived).length}</Text>
                    </View>
                    <View className="flex-row items-center justify-between py-1">
                      <Text className={`text-xs ${typeface.regular}`} style={{ color: palette.textMuted }}>Archived</Text>
                      <Text className={`text-xs ${typeface.semibold}`} style={{ color: palette.text }}>{archivedThoughts.length}</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>

          {/* Bottom Navigation Sub-Tabs in Settings */}
          <View
            style={{
              backgroundColor: settings.darkMode ? '#1C1C1C' : '#F5F5EE',
              borderTopWidth: 1,
              borderColor: settings.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              paddingBottom: Math.max(insets.bottom, 12),
            }}
            className="px-3 pt-2"
          >
            <View
              onLayout={(e: LayoutChangeEvent) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && w !== tabBarWidth) {
                  setTabBarWidth(w);
                  indicatorX.value = activeTabIndex * ((w - 12) / SETTINGS_TABS.length);
                }
              }}
              className="flex-row items-center relative py-1"
              role="tablist"
            >
              {/* Sliding Background Pill */}
              {tabItemWidth > 0 && (
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: 2,
                      bottom: 2,
                      left: 6,
                      borderRadius: 14,
                      backgroundColor: settings.darkMode
                        ? 'rgba(255, 255, 255, 0.09)'
                        : 'rgba(0, 0, 0, 0.06)',
                      borderWidth: 1.5,
                      borderColor: activeGeneralThemeColor,
                    },
                    tabIndicatorStyle,
                  ]}
                />
              )}

              {SETTINGS_TABS.map((tab) => {
                const isTabActive = activeTab === tab.id;
                const IconC = tab.icon;

                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => handleSelectTab(tab.id)}
                    role="tab"
                    aria-selected={isTabActive}
                    className="flex-1 items-center justify-center py-2 px-1 relative z-10"
                  >
                    <IconC
                      size={18}
                      color={isTabActive ? activeGeneralThemeColor : palette.textMuted}
                      strokeWidth={isTabActive ? 2.4 : 1.8}
                    />
                    <Text
                      numberOfLines={1}
                      className={`text-[11px] mt-1 ${isTabActive ? typeface.semibold : typeface.medium}`}
                      style={{
                        color: isTabActive
                          ? settings.darkMode
                            ? '#FFFFFF'
                            : '#1A1A1A'
                          : palette.textMuted,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
