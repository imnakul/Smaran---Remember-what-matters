import { View, Text, FlatList, Pressable, Platform, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Settings as SettingsIcon, Flame, Focus } from 'lucide-react-native';
import { isToday, format } from 'date-fns';
import * as NavigationBar from 'expo-navigation-bar';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useShareIntentContext } from 'expo-share-intent';

import { useThoughts } from '../src/hooks/useThoughts';
import { useSelectedDate } from '../src/hooks/useSelectedDate';
import { useSettings } from '../src/context/SettingsContext';
import { useSync } from '../src/context/SyncContext';
import { NEUTRAL } from '../src/constants/theme';
import { DateStrip } from '../src/components/DateStrip';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { ThoughtCard } from '../src/components/ThoughtCard';
import { ProgressRing } from '../src/components/ProgressRing';
import { DayCompleteBanner } from '../src/components/DayCompleteBanner';
import { ConfettiBurst } from '../src/components/ConfettiBurst';
import { AddEditThoughtModal } from '../src/components/AddEditThoughtModal';
import { ThoughtDetailModal } from '../src/components/ThoughtDetailModal';
import { SettingsModal } from '../src/components/SettingsModal';
import { PinSetupModal, PinSetupMode } from '../src/components/PinSetupModal';
import { NotionSetupModal } from '../src/components/NotionSetupModal';
import { SyncStatusPill } from '../src/components/SyncStatusPill';
import { UndoSnackbar } from '../src/components/UndoSnackbar';
import { GlassSurface } from '../src/components/GlassSurface';
import { StatsModal } from '../src/components/StatsModal';
import { FocusModal } from '../src/components/FocusModal';
import { computeStreak } from '../src/lib/stats';
import { getScheduledThoughtsForDate, getProgressForDate, isThoughtCompletedOnDate } from '../src/lib/scheduling';
import { Thought, ThoughtDraft, CollectionId, COLLECTIONS, WALLPAPER_DIM_OPACITY } from '../src/types';
import { useTypeface } from '../src/hooks/useTypeface';
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function Home() {
  const typeface = useTypeface();
  const insets = useSafeAreaInsets();
  const { thoughts, addThought, updateThought, deleteThought, restoreThought, toggleCompletion, setArchived, replaceAll, reload } = useThoughts();
  const { selectedDate, setDate, nextDay, prevDay } = useSelectedDate();
  const { settings, updateSettings } = useSettings();
  const { requestSync, syncVersion } = useSync();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;

  const activeCollection: CollectionId = settings.activeCollection ?? 'remember';
  const [tabDirection, setTabDirection] = useState<number>(0);

  const contentSlideX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  const handleSelectCollection = (id: CollectionId) => {
    if (id === activeCollection) return;
    const prevIdx = COLLECTIONS.findIndex(c => c.id === activeCollection);
    const nextIdx = COLLECTIONS.findIndex(c => c.id === id);
    const dir = nextIdx > prevIdx ? 1 : -1;
    setTabDirection(dir);
    updateSettings({ activeCollection: id });
  };

  useEffect(() => {
    if (tabDirection !== 0) {
      contentSlideX.value = tabDirection * 35;
      contentOpacity.value = 0.4;
      contentSlideX.value = withTiming(0, {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      contentOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [activeCollection, tabDirection]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingThought, setEditingThought] = useState<Thought | undefined>(undefined);
  const [openThought, setOpenThought] = useState<Thought | undefined>(undefined);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const [pinFlow, setPinFlow] = useState<PinSetupMode | null>(null);
  const [notionSetupVisible, setNotionSetupVisible] = useState(false);
  /**
   * The thought most recently deleted, held only long enough to offer an undo.
   * Keeping the whole record (not just its id) is what makes restoring possible
   * after it has already left storage.
   */
  const [recentlyDeleted, setRecentlyDeleted] = useState<Thought | undefined>(undefined);
  const [sharedContent, setSharedContent] = useState<string | undefined>(undefined);
  const streak = computeStreak(thoughts);

  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  // The sync engine writes straight to storage, so the hook has to re-read once
  // a pass actually changed something.
  useEffect(() => {
    if (syncVersion === 0) return;
    void reload();
  }, [syncVersion, reload]);

  useEffect(() => {
    if (hasShareIntent && shareIntent.text) {
      setSharedContent(shareIntent.text);
      setEditingThought(undefined);
      setModalVisible(true);
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    try {
      NavigationBar.setStyle(settings.darkMode ? 'light' : 'dark');
    } catch {}
  }, [settings.darkMode]);

  const isRemember = activeCollection === 'remember';
  const collectionMeta = COLLECTIONS.find(c => c.id === activeCollection) ?? COLLECTIONS[0];
  const collectionThoughts = thoughts.filter(t => (t.collection ?? 'remember') === activeCollection);
  const scheduledThoughts = getScheduledThoughtsForDate(collectionThoughts, selectedDate);
  const displayedThoughts = isRemember
    ? scheduledThoughts
    : collectionThoughts.filter(t => !t.archived);

  const progress = getProgressForDate(collectionThoughts, selectedDate);
  const isDayComplete = isRemember && progress.total > 0 && progress.completed === progress.total;

  const celebratedDatesRef = useRef<Set<string>>(new Set());
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const [confettiKey, setConfettiKey] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isDayComplete && !celebratedDatesRef.current.has(dateKey)) {
      celebratedDatesRef.current.add(dateKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfettiKey(Date.now());
    }
  }, [isDayComplete, dateKey]);

  const handleSaveThought = (data: ThoughtDraft) => {
    if (editingThought) {
      updateThought({
        ...editingThought,
        ...data,
      });
    } else {
      addThought({
        ...data,
        collection: data.collection ?? activeCollection,
      });
    }
    setModalVisible(false);
    setEditingThought(undefined);
    setSharedContent(undefined);
  };

  const handleDelete = (thought: Thought) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteThought(thought.id);
    setRecentlyDeleted(thought);
  };

  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    restoreThought(recentlyDeleted);
    setRecentlyDeleted(undefined);
  };

  const openAddModal = () => {
    setEditingThought(undefined);
    setModalVisible(true);
  };

  const openEditModal = (thought: Thought) => {
    setEditingThought(thought);
    setModalVisible(true);
  };

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isRemember)
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > 50) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(prevDay)();
      } else if (e.translationX < -50) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(nextDay)();
      }
      translateX.value = withTiming(0, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value + contentSlideX.value }],
      opacity: contentOpacity.value,
    };
  });

  const emptyMessage =
    activeCollection === 'learnings'
      ? 'No learnings recorded yet. Tap + to add your first takeaway.'
      : activeCollection === 'blessings'
      ? 'No blessings recorded yet. Tap + to record a moment of gratitude.'
      : activeCollection === 'sayings'
      ? 'No sayings recorded yet. Tap + to save an inspiring quote.'
      : activeCollection === 'tryDoing'
      ? 'No experiments recorded yet. Tap + to try something new.'
      : 'No thoughts scheduled for this date.';

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: settings.wallpaperUri ? 'transparent' : palette.background }}
    >
    <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
      {settings.wallpaperUri && (
        <ImageBackground
          source={{ uri: settings.wallpaperUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: palette.background,
                opacity: WALLPAPER_DIM_OPACITY[settings.wallpaperDim],
              },
            ]}
          />
        </ImageBackground>
      )}

      {/* Top Header */}
      <View
        className="px-6 pt-1 pb-2 flex-row items-center justify-between"
      >
        {isRemember ? (
          <GlassSurface>
            <Pressable
              onPress={() => setStatsVisible(true)}
              aria-label={`Streak: ${streak} days. Open stats`}
              role="button"
              className="flex-row items-center gap-1 px-3 py-1.5"
            >
              <Flame size={14} color={streak > 0 ? '#E08A3E' : palette.textMuted} />
              <Text className={`text-xs ${typeface.semibold}`} style={{ color: palette.text }}>
                {streak}
              </Text>
            </Pressable>
          </GlassSurface>
        ) : (
          <View className="flex-row items-center gap-2">
            <Text className={`text-xl ${typeface.semibold}`} style={{ color: palette.text }}>
              {collectionMeta.label}
            </Text>
            <View
              className="px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: settings.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)',
              }}
            >
              <Text className={`text-xs ${typeface.semibold}`} style={{ color: palette.textMuted }}>
                {displayedThoughts.length}
              </Text>
            </View>
          </View>
        )}

        <View className="flex-row items-center gap-1">
          <SyncStatusPill />
          <Pressable
            onPress={() => setSettingsVisible(true)}
            aria-label="Open settings"
            role="button"
            className="p-3 -mr-1"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <SettingsIcon size={22} color={palette.text} />
          </Pressable>
        </View>
      </View>

      {/* Calendar & Completion Ring only for Remember Tab */}
      {isRemember && (
        <>
          <DateStrip selectedDate={selectedDate} onSelectDate={setDate} />

          <View className="px-6 py-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <ProgressRing
                completed={progress.completed}
                total={progress.total}
                trackColor={palette.pillMuted}
                fillColor="#7A967A"
              />
              <Text className={`text-sm ${typeface.medium}`} style={{ color: palette.textMuted }}>
                {progress.completed}/{progress.total} Completed
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {scheduledThoughts.length > 0 && (
                <GlassSurface>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFocusVisible(true);
                    }}
                    aria-label="Start focus mode"
                    role="button"
                    className="flex-row items-center gap-1.5 px-3 py-1.5"
                  >
                    <Focus size={13} color={palette.text} />
                    <Text className={`text-xs ${typeface.semibold}`} style={{ color: palette.text }}>Focus</Text>
                  </Pressable>
                </GlassSurface>
              )}
              {!isToday(selectedDate) && (
                <GlassSurface>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDate(new Date());
                    }}
                    aria-label="Jump to today"
                    role="button"
                    className="flex-row items-center gap-1.5 px-3 py-1.5"
                  >
                    <Calendar size={13} color={palette.text} />
                    <Text className={`text-xs ${typeface.semibold}`} style={{ color: palette.text }}>Today</Text>
                  </Pressable>
                </GlassSurface>
              )}
            </View>
          </View>

          {isDayComplete && (
            <View className="relative">
              <DayCompleteBanner background={palette.pillMuted} textColor={palette.text} />
              {confettiKey !== undefined && <ConfettiBurst key={confettiKey} />}
            </View>
          )}
        </>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <FlatList
            data={displayedThoughts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ThoughtCard
                thought={item}
                isCompleted={isThoughtCompletedOnDate(item, selectedDate)}
                onToggle={() => toggleCompletion(item, selectedDate)}
                onEdit={() => openEditModal(item)}
                onOpen={() => setOpenThought(item)}
                onArchive={() => setArchived(item, true)}
                onDelete={() => handleDelete(item)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 110, paddingTop: isRemember ? 0 : 8 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pt-20 px-10">
                <Text className={`text-center ${typeface.regular} text-base`} style={{ color: palette.textMuted }}>
                  {emptyMessage}
                </Text>
              </View>
            }
          />
        </Animated.View>
      </GestureDetector>

      {/* Floating Action Button (Transparent Frosted Glass Squircle) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 24,
            bottom: insets.bottom + 96,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: settings.darkMode ? 0.35 : 0.16,
            shadowRadius: 10,
            elevation: 8,
          },
          fabStyle,
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openAddModal();
          }}
          onPressIn={() => {
            fabScale.value = withTiming(0.92, { duration: 90 });
          }}
          onPressOut={() => {
            fabScale.value = withTiming(1, { duration: 120 });
          }}
          aria-label="Add a new thought"
          role="button"
          style={{
            width: 64,
            height: 64,
            borderRadius: 24,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: settings.darkMode
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.70)',
            borderWidth: 1.5,
            borderColor: settings.darkMode
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(255, 255, 255, 0.90)',
          }}
        >
          <BlurView
            intensity={settings.darkMode ? 35 : 60}
            tint={settings.darkMode ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <Plus size={32} color={palette.text} strokeWidth={2.4} />
        </Pressable>
      </Animated.View>

      {/* Modern Multi-Style Bottom Tab Bar */}
      <BottomTabBar
        activeCollection={activeCollection}
        onSelectCollection={handleSelectCollection}
        bottomInset={insets.bottom}
        navigationStyle={settings.navigationStyle ?? 'carousel'}
      />

      <AddEditThoughtModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingThought(undefined);
          setSharedContent(undefined);
        }}
        onSave={handleSaveThought}
        initialData={editingThought}
        initialContent={sharedContent}
        defaultCollection={activeCollection}
      />

      <ThoughtDetailModal
        thought={openThought ?? null}
        isCompleted={openThought ? isThoughtCompletedOnDate(openThought, selectedDate) : false}
        onClose={() => setOpenThought(undefined)}
        onToggle={() => {
          if (openThought) toggleCompletion(openThought, selectedDate);
        }}
        onEdit={() => {
          if (openThought) {
            openEditModal(openThought);
            setOpenThought(undefined);
          }
        }}
        onToggleArchive={() => {
          if (openThought) {
            setArchived(openThought, !openThought.archived);
            setOpenThought(undefined);
          }
        }}
        onDelete={() => {
          if (openThought) {
            handleDelete(openThought);
            setOpenThought(undefined);
          }
        }}
      />


      <PinSetupModal
        visible={pinFlow !== null}
        mode={pinFlow ?? 'set'}
        onClose={() => setPinFlow(null)}
      />

      <NotionSetupModal visible={notionSetupVisible} onClose={() => setNotionSetupVisible(false)} />

      <UndoSnackbar
        message={recentlyDeleted ? 'Thought deleted' : null}
        onUndo={handleUndoDelete}
        onDismiss={() => setRecentlyDeleted(undefined)}
      />

      <StatsModal visible={statsVisible} onClose={() => setStatsVisible(false)} thoughts={thoughts} />

      <FocusModal
        visible={focusVisible}
        onClose={() => setFocusVisible(false)}
        thoughts={scheduledThoughts}
        selectedDate={selectedDate}
        onToggle={(thought) => toggleCompletion(thought, selectedDate)}
      />
    </SafeAreaView>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        archivedThoughts={thoughts.filter(t => t.archived)}
        onUnarchive={(thought) => setArchived(thought, false)}
        onDelete={(thought) => handleDelete(thought)}
        thoughts={thoughts}
        onImport={replaceAll}
        onOpenPinFlow={setPinFlow}
        onOpenNotionSetup={() => setNotionSetupVisible(true)}
      />
    </View>
  );
}
