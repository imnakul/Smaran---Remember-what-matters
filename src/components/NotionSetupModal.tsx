import { View, Text, Modal, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, RefreshCw, Database, ExternalLink, Plus, FileText, Link2, Sparkles, Brain, BookOpen, Quote, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import Animated, { FadeIn } from 'react-native-reanimated';

import { NEUTRAL } from '../constants/theme';
import { CollectionId, COLLECTIONS } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useSync } from '../context/SyncContext';
import { useConnectivity } from '../context/ConnectivityContext';
import {
  CollectionDatabaseMap,
  NotionDatabaseOption,
  NotionPageOption,
  clearToken,
  createMissingDatabases,
  getDatabaseParentPageId,
  describeNotionError,
  findExistingInPage,
  findExistingInWorkspace,
  getToken,
  listDatabases,
  listParentPages,
  resolveNotionLink,
  setToken,
  verifyToken,
} from '../lib/notion';
import { detachCollection, invalidateTargetCache, waitForSyncIdle } from '../lib/notionSync';
import { useTypeface } from '../hooks/useTypeface';

interface NotionSetupModalProps {
  visible: boolean;
  onClose: () => void;
}

const ACCENT = '#7A967A';
const DANGER = '#C46A6A';
const INTEGRATIONS_URL = 'https://www.notion.so/my-integrations';

const ICONS = {
  remember: Brain,
  learnings: BookOpen,
  blessings: Sparkles,
  sayings: Quote,
  tryDoing: Zap,
};

/** Notion tokens are long and opaque; this is only a sanity check, not validation. */
function looksLikeToken(value: string): boolean {
  return value.trim().length >= 40;
}

function labelsFor(ids: CollectionId[]): string {
  return ids.map(id => COLLECTIONS.find(c => c.id === id)?.label ?? id).join(', ');
}

export function NotionSetupModal({ visible, onClose }: NotionSetupModalProps) {
  const typeface = useTypeface();
  const { settings, updateSettings } = useSettings();
  const { syncNow, status, lastError } = useSync();
  const { isOnline } = useConnectivity();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;

  const [tokenInput, setTokenInput] = useState('');
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [databases, setDatabases] = useState<NotionDatabaseOption[]>([]);
  const [parentPages, setParentPages] = useState<NotionPageOption[] | null>(null);
  const [linkingCollection, setLinkingCollection] = useState<CollectionId | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** The app's own databases found anywhere in the workspace. */
  const [detected, setDetected] = useState<CollectionDatabaseMap | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  /** A chosen page that already holds some of the app's databases. */
  const [pagePlan, setPagePlan] = useState<{ page: NotionPageOption; found: CollectionDatabaseMap } | null>(null);

  /** What each collection is linked to right now, folding in the legacy single id. */
  const currentLinks = useCallback((): CollectionDatabaseMap => {
    const links: CollectionDatabaseMap = { ...(settings.notionDatabaseIds ?? {}) };
    if (!links.remember && settings.notionDatabaseId) links.remember = settings.notionDatabaseId;
    return links;
  }, [settings.notionDatabaseIds, settings.notionDatabaseId]);

  /** Collections whose link `map` would change. */
  const changesFrom = useCallback(
    (map: CollectionDatabaseMap): CollectionId[] => {
      const links = currentLinks();
      return COLLECTIONS.map(c => c.id).filter(id => map[id] && map[id] !== links[id]);
    },
    [currentLinks]
  );

  /**
   * Points collections at new databases. The sync itself is left to SyncContext,
   * which reruns whenever the linked ids change -- calling syncNow here would run
   * with the previous targets captured in its closure.
   */
  const applyLinks = useCallback(
    async (map: CollectionDatabaseMap) => {
      const changed = changesFrom(map);
      if (changed.length === 0) return;

      // A pass still running against the old databases must finish before page
      // ids are cleared, or it would push every thought into the old ones.
      await waitForSyncIdle();
      const links = currentLinks();
      for (const id of changed) {
        await detachCollection(id);
        links[id] = map[id];
      }

      invalidateTargetCache();
      updateSettings({
        notionDatabaseIds: links,
        notionDatabaseId: links.remember,
        notionEnabled: true,
      });
    },
    [changesFrom, currentLinks, updateSettings]
  );

  const loadDatabases = useCallback(async () => {
    setIsWorking(true);
    setMessage(null);
    try {
      const options = await listDatabases();
      setDatabases(options);
      if (options.length === 0) {
        setMessage('No databases found. Connect one to your integration in Notion (... menu > Connections), or paste its link above -- search can lag by a minute after sharing.');
      }
    } catch (error) {
      setMessage(describeNotionError(error));
    } finally {
      setIsWorking(false);
    }
  }, []);

  const detectExisting = useCallback(async () => {
    setIsDetecting(true);
    try {
      setDetected(await findExistingInWorkspace());
    } catch {
      // Detection is a convenience; the manual paths below still work.
      setDetected(null);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setMessage(null);
    setTokenInput('');
    setLinkInput('');
    setParentPages(null);
    setLinkingCollection(null);
    setPagePlan(null);
    setDetected(null);
    getToken().then(token => {
      const stored = Boolean(token);
      setHasStoredToken(stored);
      if (stored && isOnline) {
        void loadDatabases();
        void detectExisting();
      }
    });
  }, [visible, isOnline, loadDatabases, detectExisting]);

  const handleSaveToken = useCallback(async () => {
    const value = tokenInput.trim();
    if (!looksLikeToken(value)) {
      setMessage('That does not look like a Notion integration token.');
      return;
    }

    setIsWorking(true);
    setMessage(null);
    await setToken(value);

    try {
      await verifyToken();
      setHasStoredToken(true);
      setTokenInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadDatabases();
      void detectExisting();
    } catch (error) {
      await clearToken();
      setHasStoredToken(false);
      setMessage(describeNotionError(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsWorking(false);
    }
  }, [tokenInput, loadDatabases, detectExisting]);

  const handlePickDatabase = useCallback(
    async (option: NotionDatabaseOption, targetCol: CollectionId = 'remember') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await applyLinks({ [targetCol]: option.id });
      setLinkingCollection(null);
      setMessage(null);
    },
    [applyLinks]
  );

  const handleLinkDetected = useCallback(async () => {
    if (!detected) return;
    setIsWorking(true);
    try {
      await applyLinks(detected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsWorking(false);
    }
  }, [detected, applyLinks]);

  const startCreateFlow = useCallback(async () => {
    setIsWorking(true);
    setMessage(null);
    setPagePlan(null);
    try {
      const pages = await listParentPages();
      setParentPages(pages);
      if (pages.length === 0) {
        setMessage('No pages found. Add your integration to a page in Notion (... menu > Connections). If you just did, paste the page link above instead -- search takes a moment to catch up.');
      }
    } catch (error) {
      setMessage(describeNotionError(error));
    } finally {
      setIsWorking(false);
    }
  }, []);

  /** Links what `found` already covers and creates the rest inside `pageId`. */
  const linkAndCreateMissing = useCallback(
    async (pageId: string, found: CollectionDatabaseMap) => {
      setIsWorking(true);
      setMessage(null);
      try {
        const merged = await createMissingDatabases(pageId, found);
        await applyLinks(merged);
        setParentPages(null);
        setPagePlan(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadDatabases();
      } catch (error) {
        setMessage(describeNotionError(error));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsWorking(false);
      }
    },
    [applyLinks, loadDatabases]
  );

  const handleLinkFoundOnly = useCallback(async () => {
    if (!pagePlan) return;
    setIsWorking(true);
    try {
      await applyLinks(pagePlan.found);
      setPagePlan(null);
      setParentPages(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsWorking(false);
    }
  }, [pagePlan, applyLinks]);

  /**
   * A page was chosen, by link or from the list. Look inside it first: on a new
   * device it usually already holds the databases, and creating a fresh set
   * would leave the user staring at empty tabs.
   */
  const handleChoosePage = useCallback(
    async (page: NotionPageOption) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsWorking(true);
      setMessage(null);
      let found: CollectionDatabaseMap;
      try {
        found = await findExistingInPage(page.id);
      } catch (error) {
        setMessage(describeNotionError(error));
        return;
      } finally {
        setIsWorking(false);
      }

      if (Object.keys(found).length > 0) {
        setPagePlan({ page, found });
        return;
      }

      Alert.alert(
        'Create databases?',
        `No existing databases were found in "${page.title}". Create all 5 (${labelsFor(COLLECTIONS.map(c => c.id))}) there?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create', onPress: () => void linkAndCreateMissing(page.id, {}) },
        ]
      );
    },
    [linkAndCreateMissing]
  );

  const handleAutoProvisionMissing = useCallback(async () => {
    setIsWorking(true);
    setMessage(null);
    try {
      const existingDbId = settings.notionDatabaseIds?.remember ?? settings.notionDatabaseId;
      const parentPageId = existingDbId ? await getDatabaseParentPageId(existingDbId) : null;

      if (parentPageId) {
        // Link siblings that already exist before creating anything new.
        const found = await findExistingInPage(parentPageId);
        const base = currentLinks();
        for (const col of COLLECTIONS) {
          if (!base[col.id] && found[col.id]) base[col.id] = found[col.id];
        }
        await linkAndCreateMissing(parentPageId, base);
      } else {
        await startCreateFlow();
      }
    } catch (error) {
      setMessage(describeNotionError(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsWorking(false);
    }
  }, [settings.notionDatabaseIds, settings.notionDatabaseId, currentLinks, linkAndCreateMissing, startCreateFlow]);

  const handleUseLink = useCallback(async () => {
    setIsWorking(true);
    setMessage(null);
    let target: Awaited<ReturnType<typeof resolveNotionLink>>;
    try {
      target = await resolveNotionLink(linkInput);
    } catch (error) {
      setMessage(describeNotionError(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsWorking(false);
      return;
    }
    setIsWorking(false);
    setLinkInput('');
    setParentPages(null);

    if (target.kind === 'database') {
      await handlePickDatabase({ id: target.id, title: 'Linked Database' }, linkingCollection ?? 'remember');
    } else {
      await handleChoosePage({ id: target.id, title: target.title });
    }
  }, [linkInput, linkingCollection, handlePickDatabase, handleChoosePage]);

  const detectedChanges = detected ? changesFrom(detected) : [];
  const detectedReplacing = detectedChanges.filter(id => Boolean(currentLinks()[id]));

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect Notion?',
      'Your thoughts stay on this device and the Notion pages stay in Notion. They just stop syncing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await clearToken();
            invalidateTargetCache();
            updateSettings({ notionEnabled: false, notionDatabaseId: undefined, notionDatabaseIds: {} });
            setHasStoredToken(false);
            setDatabases([]);
            setParentPages(null);
            onClose();
          },
        },
      ]
    );
  }, [updateSettings, onClose]);

  const selectedId = settings.notionDatabaseId;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView className="flex-1" style={{ backgroundColor: palette.background }}>
        <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
          <Text className={`text-lg ${typeface.semibold}`} style={{ color: palette.text }}>
            Notion sync
          </Text>
          <Pressable onPress={onClose} role="button" aria-label="Close Notion settings" className="p-2">
            <X size={22} color={palette.textMuted} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
          {!isOnline && (
            <View className="rounded-2xl px-4 py-3 mb-4" style={{ backgroundColor: 'rgba(201,154,78,0.14)' }}>
              <Text className={`text-sm ${typeface.medium}`} style={{ color: '#C99A4E' }}>
                You are offline. Connect to set up Notion sync.
              </Text>
            </View>
          )}

          {!hasStoredToken ? (
            <>
              <Text className={`text-sm ${typeface.regular} leading-5 mb-4`} style={{ color: palette.textMuted }}>
                Create an internal integration in Notion, copy its secret, and paste it here. It is stored in
                this device secure keystore and never leaves your phone except to talk to Notion.
              </Text>

              <Pressable
                onPress={() => Linking.openURL(INTEGRATIONS_URL)}
                role="link"
                aria-label="Open Notion integrations page"
                className="flex-row items-center gap-2 mb-5"
              >
                <ExternalLink size={14} color={ACCENT} />
                <Text className={`text-sm ${typeface.medium}`} style={{ color: ACCENT }}>
                  Open notion.so/my-integrations
                </Text>
              </Pressable>

              <TextInput
                value={tokenInput}
                onChangeText={setTokenInput}
                placeholder="ntn_..."
                placeholderTextColor={palette.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                aria-label="Notion integration token"
                className={`rounded-2xl px-4 py-3.5 text-base ${typeface.regular}`}
                style={{ backgroundColor: palette.pillMuted, color: palette.text }}
              />

              <Pressable
                onPress={handleSaveToken}
                disabled={isWorking || !isOnline}
                role="button"
                aria-label="Connect to Notion"
                className="rounded-2xl py-3.5 items-center mt-3"
                style={{ backgroundColor: ACCENT, opacity: isWorking || !isOnline ? 0.5 : 1 }}
              >
                {isWorking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className={`text-base ${typeface.semibold} text-white`}>Connect</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {isDetecting && (
                <View className="flex-row items-center gap-2 mb-4">
                  <ActivityIndicator size="small" color={ACCENT} />
                  <Text className={`text-xs ${typeface.regular}`} style={{ color: palette.textMuted }}>
                    Looking for your existing databases in Notion...
                  </Text>
                </View>
              )}

              {!isDetecting && detectedChanges.length > 0 && (
                <Animated.View
                  entering={FadeIn.duration(160)}
                  className="rounded-2xl p-4 mb-5"
                  style={{ backgroundColor: 'rgba(122,150,122,0.14)' }}
                >
                  <Text className={`text-sm ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
                    Found your existing databases
                  </Text>
                  <Text className={`text-xs ${typeface.regular} leading-4 mb-3`} style={{ color: palette.textMuted }}>
                    {labelsFor(detectedChanges)}
                    {detectedReplacing.length > 0
                      ? `. This replaces the current link for ${labelsFor(detectedReplacing)} with the database that already has your data.`
                      : '. Link them to bring your thoughts onto this device.'}
                  </Text>
                  <Pressable
                    onPress={handleLinkDetected}
                    disabled={isWorking || !isOnline}
                    role="button"
                    aria-label="Link existing Notion databases"
                    className="flex-row items-center justify-center gap-2 rounded-2xl py-3"
                    style={{ backgroundColor: ACCENT, opacity: isWorking || !isOnline ? 0.5 : 1 }}
                  >
                    <Link2 size={15} color="#FFFFFF" />
                    <Text className={`text-sm ${typeface.semibold} text-white`}>
                      Link existing databases
                    </Text>
                  </Pressable>
                </Animated.View>
              )}

              {/* Collections status card list */}
              <Text className={`text-sm ${typeface.semibold} mb-2`} style={{ color: palette.text }}>
                Tab connections in Notion
              </Text>
              <Text className={`text-xs ${typeface.regular} leading-4 mb-3`} style={{ color: palette.textMuted }}>
                Each tab syncs with its own database in Notion with the exact same structure.
              </Text>

              <View className="rounded-2xl p-3 mb-5 border" style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
                {COLLECTIONS.map(item => {
                  const dbId = settings.notionDatabaseIds?.[item.id] ?? (item.id === 'remember' ? settings.notionDatabaseId : undefined);
                  const isConnected = Boolean(dbId);
                  const Icon = ICONS[item.id];
                  const isSelectedForLinking = linkingCollection === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setLinkingCollection(isSelectedForLinking ? null : item.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      role="button"
                      aria-label={`${item.label} collection, ${isConnected ? 'Connected' : 'Not linked'}`}
                      className="flex-row items-center justify-between py-2.5 px-2 rounded-xl mb-1"
                      style={{
                        backgroundColor: isSelectedForLinking
                          ? settings.darkMode
                            ? 'rgba(143, 168, 143, 0.2)'
                            : 'rgba(122, 150, 122, 0.12)'
                          : 'transparent',
                      }}
                    >
                      <View className="flex-row items-center gap-2.5 flex-1">
                        <View
                          className="w-7 h-7 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: isConnected
                              ? 'rgba(122, 150, 122, 0.2)'
                              : palette.pillMuted,
                          }}
                        >
                          <Icon size={14} color={isConnected ? ACCENT : palette.textMuted} />
                        </View>
                        <View className="flex-1">
                          <Text className={`text-sm ${typeface.medium}`} style={{ color: palette.text }}>
                            {item.label}
                          </Text>
                          <Text className={`text-[11px] ${typeface.regular}`} style={{ color: palette.textMuted }}>
                            {isConnected ? `Linked (${dbId?.slice(0, 6)}...)` : 'Tap to link specific database'}
                          </Text>
                        </View>
                      </View>
                      {isConnected ? (
                        <View className="flex-row items-center gap-1">
                          <Check size={14} color={ACCENT} />
                          <Text className={`text-xs ${typeface.medium}`} style={{ color: ACCENT }}>
                            Connected
                          </Text>
                        </View>
                      ) : (
                        <Text className={`text-xs ${typeface.regular}`} style={{ color: palette.textMuted }}>
                          Not linked
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Action buttons to provision all 5 databases or missing ones */}
              {pagePlan ? (
                <Animated.View
                  entering={FadeIn.duration(160)}
                  className="rounded-2xl p-4 mb-5 border"
                  style={{ backgroundColor: palette.surface, borderColor: palette.border }}
                >
                  <Text className={`text-sm ${typeface.semibold} mb-2`} style={{ color: palette.text }}>
                    Found in "{pagePlan.page.title}"
                  </Text>
                  {COLLECTIONS.map(col => {
                    const isFound = Boolean(pagePlan.found[col.id]);
                    return (
                      <View key={col.id} className="flex-row items-center gap-2 py-1">
                        {isFound ? (
                          <Check size={14} color={ACCENT} />
                        ) : (
                          <Plus size={14} color={palette.textMuted} />
                        )}
                        <Text
                          className={`text-sm ${typeface.regular}`}
                          style={{ color: isFound ? palette.text : palette.textMuted }}
                        >
                          {col.label}
                          {isFound ? '' : ' -- not found'}
                        </Text>
                      </View>
                    );
                  })}

                  <Pressable
                    onPress={handleLinkFoundOnly}
                    disabled={isWorking || !isOnline}
                    role="button"
                    aria-label="Link the databases found in this page"
                    className="flex-row items-center justify-center gap-2 rounded-2xl py-3 mt-3"
                    style={{ backgroundColor: ACCENT, opacity: isWorking || !isOnline ? 0.5 : 1 }}
                  >
                    <Link2 size={15} color="#FFFFFF" />
                    <Text className={`text-sm ${typeface.semibold} text-white`}>Link existing</Text>
                  </Pressable>

                  {COLLECTIONS.some(col => !pagePlan.found[col.id]) && (
                    <Pressable
                      onPress={() => void linkAndCreateMissing(pagePlan.page.id, pagePlan.found)}
                      disabled={isWorking || !isOnline}
                      role="button"
                      aria-label="Link existing and create the missing databases"
                      className="flex-row items-center justify-center gap-2 rounded-2xl py-3 mt-2 border"
                      style={{ borderColor: ACCENT, opacity: isWorking || !isOnline ? 0.5 : 1 }}
                    >
                      <Plus size={15} color={ACCENT} />
                      <Text className={`text-sm ${typeface.medium}`} style={{ color: ACCENT }}>
                        Link existing and create missing ({COLLECTIONS.filter(col => !pagePlan.found[col.id]).length})
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => setPagePlan(null)}
                    role="button"
                    aria-label="Cancel"
                    className="py-2 items-center mt-1"
                  >
                    <Text className={`text-sm ${typeface.medium}`} style={{ color: palette.textMuted }}>
                      Cancel
                    </Text>
                  </Pressable>
                </Animated.View>
              ) : parentPages === null ? (
                <View className="gap-2.5 mb-5">
                  <Pressable
                    onPress={startCreateFlow}
                    disabled={isWorking || !isOnline}
                    role="button"
                    aria-label="Create all 5 databases in Notion"
                    className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
                    style={
                      detectedChanges.length > 0
                        ? { borderWidth: 1, borderColor: ACCENT, opacity: isWorking || !isOnline ? 0.5 : 1 }
                        : { backgroundColor: ACCENT, opacity: isWorking || !isOnline ? 0.5 : 1 }
                    }
                  >
                    <Plus size={16} color={detectedChanges.length > 0 ? ACCENT : '#FFFFFF'} />
                    <Text
                      className={`text-sm ${typeface.semibold}`}
                      style={{ color: detectedChanges.length > 0 ? ACCENT : '#FFFFFF' }}
                    >
                      Create all 5 databases for me
                    </Text>
                  </Pressable>

                  {(settings.notionDatabaseId || Object.keys(settings.notionDatabaseIds ?? {}).length > 0) &&
                    COLLECTIONS.some(c => !settings.notionDatabaseIds?.[c.id] && !(c.id === 'remember' && settings.notionDatabaseId)) && (
                      <Pressable
                        onPress={handleAutoProvisionMissing}
                        disabled={isWorking || !isOnline}
                        role="button"
                        aria-label="Auto-create missing collection databases in Notion"
                        className="flex-row items-center justify-center gap-2 rounded-2xl py-3 border"
                        style={{
                          borderColor: ACCENT,
                          opacity: isWorking || !isOnline ? 0.5 : 1,
                        }}
                      >
                        <Sparkles size={15} color={ACCENT} />
                        <Text className={`text-sm ${typeface.medium}`} style={{ color: ACCENT }}>
                          Auto-create missing tabs in Notion
                        </Text>
                      </Pressable>
                    )}
                </View>
              ) : (
                <Animated.View entering={FadeIn.duration(160)} className="mb-5">
                  <Text
                    className={`text-sm ${typeface.semibold} mb-1`}
                    style={{ color: palette.text }}
                  >
                    Where should they live?
                  </Text>
                  <Text
                    className={`text-xs ${typeface.regular} leading-4 mb-3`}
                    style={{ color: palette.textMuted }}
                  >
                    Pick a page. If your databases are already in it, they get linked; otherwise all 5 are created there.
                  </Text>

                  {parentPages.map(page => (
                    <Pressable
                      key={page.id}
                      onPress={() => void handleChoosePage(page)}
                      disabled={isWorking}
                      role="button"
                      aria-label={`Use ${page.title} for the databases`}
                      className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 mb-2"
                      style={{ backgroundColor: palette.pillMuted, opacity: isWorking ? 0.5 : 1 }}
                    >
                      <FileText size={16} color={palette.textMuted} />
                      <Text
                        numberOfLines={1}
                        className={`flex-1 text-sm ${typeface.medium}`}
                        style={{ color: palette.text }}
                      >
                        {page.title}
                      </Text>
                    </Pressable>
                  ))}

                  <Pressable
                    onPress={() => setParentPages(null)}
                    role="button"
                    aria-label="Cancel creating databases"
                    className="py-2 items-center"
                  >
                    <Text className={`text-sm ${typeface.medium}`} style={{ color: palette.textMuted }}>
                      Cancel
                    </Text>
                  </Pressable>
                </Animated.View>
              )}

              <Text className={`text-sm ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
                {linkingCollection ? `Paste link for ${linkingCollection}` : 'Paste a Notion page or database link'}
              </Text>
              <Text className={`text-xs ${typeface.regular} leading-4 mb-3`} style={{ color: palette.textMuted }}>
                Pasting a page link links the databases already inside it, or offers to create them. Pasting a database link connects it to {linkingCollection ? `"${linkingCollection}"` : '"Remember"'}.
              </Text>
              <View className="flex-row items-center gap-2 mb-5">
                <TextInput
                  value={linkInput}
                  onChangeText={setLinkInput}
                  placeholder="https://notion.so/..."
                  placeholderTextColor={palette.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  aria-label="Notion page or database link"
                  className={`flex-1 rounded-2xl px-4 py-3.5 text-sm ${typeface.regular}`}
                  style={{ backgroundColor: palette.pillMuted, color: palette.text }}
                />
                <Pressable
                  onPress={handleUseLink}
                  disabled={isWorking || !isOnline || linkInput.trim().length === 0}
                  role="button"
                  aria-label="Connect using the pasted Notion link"
                  className="rounded-2xl px-4 py-3.5 items-center justify-center"
                  style={{
                    backgroundColor: ACCENT,
                    opacity: isWorking || !isOnline || linkInput.trim().length === 0 ? 0.5 : 1,
                  }}
                >
                  <Link2 size={18} color="#FFFFFF" />
                </Pressable>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.text }}>
                  {linkingCollection ? `Choose database for ${linkingCollection}` : 'Or choose an existing database'}
                </Text>
                <Pressable
                  onPress={loadDatabases}
                  disabled={isWorking || !isOnline}
                  role="button"
                  aria-label="Refresh database list"
                  className="p-2"
                >
                  <RefreshCw size={16} color={palette.textMuted} />
                </Pressable>
              </View>

              {isWorking && databases.length === 0 ? (
                <ActivityIndicator color={ACCENT} className="my-6" />
              ) : (
                databases.map(option => {
                  const targetCol = linkingCollection ?? 'remember';
                  const isSelected = (settings.notionDatabaseIds?.[targetCol] ?? (targetCol === 'remember' ? settings.notionDatabaseId : undefined)) === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handlePickDatabase(option, targetCol)}
                      role="button"
                      aria-label={`Sync with ${option.title}`}
                      className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 mb-2"
                      style={{
                        backgroundColor: isSelected ? 'rgba(122,150,122,0.14)' : palette.pillMuted,
                      }}
                    >
                      <Database size={16} color={isSelected ? ACCENT : palette.textMuted} />
                      <Text
                        numberOfLines={1}
                        className={`flex-1 text-sm ${typeface.medium}`}
                        style={{ color: palette.text }}
                      >
                        {option.title}
                      </Text>
                      {isSelected && <Check size={16} color={ACCENT} />}
                    </Pressable>
                  );
                })
              )}

              {settings.notionEnabled && (
                <View className="mt-5">
                  <Pressable
                    onPress={() => void syncNow()}
                    disabled={!isOnline || status === 'syncing'}
                    role="button"
                    aria-label="Sync now"
                    className="rounded-2xl py-3.5 items-center"
                    style={{
                      backgroundColor: palette.pillMuted,
                      opacity: !isOnline || status === 'syncing' ? 0.5 : 1,
                    }}
                  >
                    <Text className={`text-base ${typeface.semibold}`} style={{ color: palette.text }}>
                      {status === 'syncing' ? 'Syncing...' : 'Sync now'}
                    </Text>
                  </Pressable>

                  <Text
                    className={`text-xs ${typeface.regular} text-center mt-3`}
                    style={{ color: palette.textMuted }}
                  >
                    {settings.notionLastSyncedAt
                      ? `Last synced ${new Date(settings.notionLastSyncedAt).toLocaleString()}`
                      : 'Not synced yet'}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleDisconnect}
                role="button"
                aria-label="Disconnect Notion"
                className="rounded-2xl py-3.5 items-center mt-3"
              >
                <Text className={`text-sm ${typeface.medium}`} style={{ color: DANGER }}>
                  Disconnect Notion
                </Text>
              </Pressable>
            </>
          )}

          {(message ?? (status === 'error' ? lastError : null)) && (
            <Animated.Text
              entering={FadeIn.duration(160)}
              accessibilityLiveRegion="polite"
              className={`text-sm ${typeface.regular} leading-5 mt-4 text-center`}
              style={{ color: message ? palette.textMuted : DANGER }}
            >
              {message ?? lastError}
            </Animated.Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
