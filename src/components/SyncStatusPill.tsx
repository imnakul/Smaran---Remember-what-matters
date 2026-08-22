import { Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useConnectivity } from '../context/ConnectivityContext';
import { useSync } from '../context/SyncContext';
import { SyncStatus } from '../types';
import { useTypeface } from '../hooks/useTypeface';

/** How long the success state lingers before the pill fades out again. */
const SUCCESS_LINGER_MS = 2200;

const AMBER = '#C99A4E';
const RED = '#C46A6A';
const GREEN = '#7A967A';

/**
 * Compact indicator for connectivity and Notion sync.
 *
 * Offline is reported whether or not Notion is configured, because the user
 * asked to know when the app is running without a network at all. The sync
 * states only appear once a database is connected -- an unconfigured app has
 * nothing to say about syncing and a permanent grey pill would just be noise.
 */
export function SyncStatusPill() {
  const typeface = useTypeface();
  const { isOnline } = useConnectivity();
  const { status, lastError, syncNow } = useSync();

  const [showSuccess, setShowSuccess] = useState(false);
  const rotation = useSharedValue(0);

  // Let the success tick breathe, then retire it so the header returns to rest.
  useEffect(() => {
    if (status !== 'synced') {
      setShowSuccess(false);
      return;
    }
    setShowSuccess(true);
    const id = setTimeout(() => setShowSuccess(false), SUCCESS_LINGER_MS);
    return () => clearTimeout(id);
  }, [status]);

  useEffect(() => {
    if (status === 'syncing') {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 1100, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [status, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const variant = resolveVariant({ isOnline, status, showSuccess });
  if (!variant) return null;

  const handlePress = () => {
    if (!isOnline) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void syncNow();
  };

  const label = variant.kind === 'error' && lastError ? lastError : variant.label;

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)}>
      <Pressable
        onPress={handlePress}
        disabled={!isOnline}
        role="button"
        aria-label={variant.kind === 'error' && lastError ? `Sync failed: ${lastError}. Retry` : variant.a11y}
        accessibilityLiveRegion="polite"
        className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
        style={{ backgroundColor: variant.tint }}
      >
        {variant.kind === 'syncing' ? (
          <Animated.View style={spinStyle}>
            <RefreshCw size={12} color={variant.color} />
          </Animated.View>
        ) : variant.kind === 'offline' ? (
          <CloudOff size={12} color={variant.color} />
        ) : variant.kind === 'error' ? (
          <AlertCircle size={12} color={variant.color} />
        ) : (
          <Check size={12} color={variant.color} />
        )}

        {variant.kind !== 'success' && (
          <Text
            numberOfLines={1}
            className={`text-xs ${typeface.medium} max-w-[140px]`}
            style={{ color: variant.color }}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface Variant {
  kind: 'offline' | 'syncing' | 'error' | 'success';
  label: string;
  a11y: string;
  color: string;
  tint: string;
}

function resolveVariant(input: {
  isOnline: boolean;
  status: SyncStatus;
  showSuccess: boolean;
}): Variant | null {
  if (!input.isOnline) {
    return {
      kind: 'offline',
      label: 'Offline',
      a11y: 'Offline. Your thoughts are saved on this device.',
      color: AMBER,
      tint: 'rgba(201,154,78,0.14)',
    };
  }
  if (input.status === 'syncing') {
    return {
      kind: 'syncing',
      label: 'Syncing',
      a11y: 'Syncing with Notion',
      color: GREEN,
      tint: 'rgba(122,150,122,0.14)',
    };
  }
  if (input.status === 'error') {
    return {
      kind: 'error',
      label: 'Sync failed',
      a11y: 'Sync failed. Tap to retry.',
      color: RED,
      tint: 'rgba(196,106,106,0.14)',
    };
  }
  if (input.showSuccess) {
    return {
      kind: 'success',
      label: 'Synced',
      a11y: 'Synced with Notion',
      color: GREEN,
      tint: 'rgba(122,150,122,0.14)',
    };
  }
  return null;
}
