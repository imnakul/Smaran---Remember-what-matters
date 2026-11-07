import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useCallback, useState } from 'react';
import { Download, RefreshCw, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useTypeface } from '../hooks/useTypeface';
import { UpdateInfo, checkForUpdate, currentVersion, downloadAndInstall, formatBytes } from '../lib/updates';

const ACCENT = '#7A967A';
const DANGER = '#C46A6A';

type Phase =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'upToDate' }
  | { kind: 'available'; update: UpdateInfo }
  | { kind: 'downloading'; update: UpdateInfo; progress: number }
  | { kind: 'error'; message: string; update?: UpdateInfo };

/** "Check for updates" card: finds the latest GitHub release and installs it. */
export function AppUpdateCard() {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const { isOnline } = useConnectivity();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const check = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPhase({ kind: 'checking' });
    try {
      const update = await checkForUpdate();
      setPhase(update ? { kind: 'available', update } : { kind: 'upToDate' });
    } catch (error) {
      setPhase({ kind: 'error', message: error instanceof Error ? error.message : 'Could not check for updates.' });
    }
  }, []);

  const install = useCallback(async (update: UpdateInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase({ kind: 'downloading', update, progress: 0 });
    try {
      await downloadAndInstall(update, progress => {
        setPhase(prev => (prev.kind === 'downloading' ? { ...prev, progress } : prev));
      });
      // The system installer is now on screen; if the user backs out, let them retry.
      setPhase({ kind: 'available', update });
    } catch (error) {
      setPhase({
        kind: 'error',
        update,
        message: error instanceof Error ? error.message : 'Download failed.',
      });
    }
  }, []);

  const busy = phase.kind === 'checking' || phase.kind === 'downloading';

  let status = `Version ${currentVersion()}`;
  if (phase.kind === 'upToDate') status = `Version ${currentVersion()} -- you're on the latest`;
  if (phase.kind === 'available') status = `Version ${phase.update.version} is available ${formatBytes(phase.update.sizeBytes) ? `(${formatBytes(phase.update.sizeBytes)})` : ''}`;
  if (phase.kind === 'downloading') {
    status = phase.progress >= 0 ? `Downloading... ${Math.round(phase.progress * 100)}%` : 'Downloading...';
  }

  const pendingUpdate = phase.kind === 'available' ? phase.update : phase.kind === 'error' ? phase.update : undefined;

  return (
    <View className="p-4 rounded-2xl border" style={{ backgroundColor: palette.surface, borderColor: palette.border }}>
      <Text className={`text-base ${typeface.semibold} mb-1`} style={{ color: palette.text }}>
        App updates
      </Text>
      <Text
        className={`text-xs ${typeface.regular} mb-4`}
        style={{ color: palette.textMuted }}
        accessibilityLiveRegion="polite"
      >
        {status}
      </Text>

      {phase.kind === 'downloading' && phase.progress >= 0 && (
        <View className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: palette.pillMuted }}>
          <View className="h-full rounded-full" style={{ width: `${phase.progress * 100}%`, backgroundColor: ACCENT }} />
        </View>
      )}

      {phase.kind === 'error' && (
        <Text className={`text-xs ${typeface.regular} mb-3`} style={{ color: DANGER }}>
          {phase.message}
        </Text>
      )}

      {pendingUpdate ? (
        <Pressable
          onPress={() => void install(pendingUpdate)}
          disabled={busy || !isOnline}
          role="button"
          aria-label={`Download and install version ${pendingUpdate.version}`}
          className="flex-row items-center justify-center gap-2 p-3.5 rounded-xl"
          style={{ backgroundColor: ACCENT, opacity: busy || !isOnline ? 0.5 : 1 }}
        >
          <Download size={15} color="#FFFFFF" />
          <Text className={`text-sm ${typeface.semibold} text-white`}>Update to {pendingUpdate.version}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => void check()}
          disabled={busy || !isOnline}
          role="button"
          aria-label="Check for updates"
          className="flex-row items-center justify-center gap-2 p-3.5 rounded-xl border"
          style={{ borderColor: palette.border, opacity: busy || !isOnline ? 0.5 : 1 }}
        >
          {busy ? (
            <ActivityIndicator size="small" color={palette.text} />
          ) : phase.kind === 'upToDate' ? (
            <Check size={15} color={ACCENT} />
          ) : (
            <RefreshCw size={15} color={palette.text} />
          )}
          <Text className={`text-sm ${typeface.semibold}`} style={{ color: palette.text }}>
            {isOnline ? 'Check for updates' : 'Offline'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
