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
  NotionDatabaseOption,
  NotionPageOption,
  clearToken,
  createDatabase,
  createAllDatabases,
  getDatabaseParentPageId,
  describeNotionError,
  getToken,
  listDatabases,
  listParentPages,
  resolveNotionLink,
  setToken,
  verifyToken,
} from '../lib/notion';
import { invalidateTargetCache } from '../lib/notionSync';
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

  useEffect(() => {
    if (!visible) return;
    setMessage(null);
    setTokenInput('');
    setLinkInput('');
    setParentPages(null);
    setLinkingCollection(null);
    getToken().then(token => {
      const stored = Boolean(token);
      setHasStoredToken(stored);
      if (stored && isOnline) void loadDatabases();
    });
  }, [visible, isOnline, loadDatabases]);

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
    } catch (error) {
      await clearToken();
      setHasStoredToken(false);
      setMessage(describeNotionError(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsWorking(false);
    }
  }, [tokenInput, loadDatabases]);

  const handlePickDatabase = useCallback(
    async (option: NotionDatabaseOption, targetCol: CollectionId = 'remember') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      invalidateTargetCache();
      const currentMap = { ...(settings.notionDatabaseIds ?? {}) };
      currentMap[targetCol] = option.id;
      if (targetCol === 'remember') {
        updateSettings({
          notionDatabaseId: option.id,
          notionDatabaseIds: currentMap,
          notionEnabled: true,
        });
      } else {
        updateSettings({
          notionDatabaseIds: currentMap,
          notionEnabled: true,
        });
      }
      setLinkingCollection(null);
      setMessage(null);
      await syncNow();
    },
    [settings.notionDatabaseIds, updateSettings, syncNow]
  );

  const startCreateFlow = useCallback(async () => {
    setIsWorking(true);
    setMessage(null);
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

  const handleCreateAllDatabases = useCallback(
    async (page: NotionPageOption) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsWorking(true);
      setMessage(null);
      try {
        const createdMap = await createAllDatabases(page.id);
        invalidateTargetCache();
        updateSettings({
          notionDatabaseId: createdMap.remember,
          notionDatabaseIds: createdMap,
          notionEnabled: true,
        });
        setParentPages(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadDatabases();
        await syncNow();
      } catch (error) {
        setMessage(describeNotionError(error));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsWorking(false);
      }
    },
    [updateSettings, loadDatabases, syncNow]
  );

  const handleAutoProvisionMissing = useCallback(async () => {
    setIsWorking(true);
    setMessage(null);
    try {
      const existingDbId = settings.notionDatabaseIds?.remember ?? settings.notionDatabaseId;
      let parentPageId: string | null = null;
      if (existingDbId) {
        parentPageId = await getDatabaseParentPageId(existingDbId);
      }

      if (parentPageId) {
        const currentMap = { ...(settings.notionDatabaseIds ?? {}) };
        for (const col of COLLECTIONS) {
          if (!currentMap[col.id]) {
            const dbId = await createDatabase(parentPageId, col.notionTitle);
            currentMap[col.id] = dbId;
          }
        }
        invalidateTargetCache();
        updateSettings({
          notionDatabaseIds: currentMap,
          notionDatabaseId: currentMap.remember ?? settings.notionDatabaseId,
          notionEnabled: true,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadDatabases();
        await syncNow();
      } else {
        await startCreateFlow();
      }
    } catch (error) {
      setMessage(describeNotionError(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsWorking(false);
    }
  }, [settings.notionDatabaseIds, settings.notionDatabaseId, updateSettings, loadDatabases, syncNow, startCreateFlow]);

  const handleUseLink = useCallback(async () => {
    setIsWorking(true);
    setMessage(null);
    try {
      const target = await resolveNotionLink(linkInput);

      if (target.kind === 'database') {
        const colToUse = linkingCollection ?? 'remember';
        await handlePickDatabase({ id: target.id, title: 'Linked Database' }, colToUse);
      } else {
        // Page target -> create all 5 databases inside this page
        await handleCreateAllDatabases({ id: target.id, title: target.title });
      }

      setLinkInput('');
      setParentPages(null);
    } catch (error) {
      setMessage(describeNotionError(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsWorking(false);
    }
  }, [linkInput, linkingCollection, handlePickDatabase, handleCreateAllDatabases]);

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
              {parentPages === null ? (
                <View className="gap-2.5 mb-5">
                  <Pressable
                    onPress={startCreateFlow}
                    disabled={isWorking || !isOnline}
                    role="button"
                    aria-label="Create all 5 databases in Notion"
                    className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
                    style={{
                      backgroundColor: ACCENT,
                      opacity: isWorking || !isOnline ? 0.5 : 1,
                    }}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text className={`text-sm ${typeface.semibold} text-white`}>
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
                    Pick a page to hold all 5 databases (Remember, Learnings, Blessings, Sayings, Try Doing).
                  </Text>

                  {parentPages.map(page => (
                    <Pressable
                      key={page.id}
                      onPress={() => handleCreateAllDatabases(page)}
                      disabled={isWorking}
                      role="button"
                      aria-label={`Create all 5 databases inside ${page.title}`}
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
                Pasting a page link creates all 5 databases inside it. Pasting a database link connects it to {linkingCollection ? `"${linkingCollection}"` : '"Remember"'}.
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
