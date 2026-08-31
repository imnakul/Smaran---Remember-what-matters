import { View, Text } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { PinPad } from './PinPad';
import { NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useLock } from '../context/LockContext';
import { verifyPin, getRemainingLockoutMs } from '../lib/pin';
import { useTypeface } from '../hooks/useTypeface';

function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

/**
 * Full-screen PIN gate. Rendered above the app rather than as a route, so no
 * navigation state can slip past it and no content paints underneath.
 */
export function LockScreen() {
  const typeface = useTypeface();
  const { settings } = useSettings();
  const { unlock } = useLock();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;

  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [shakeToken, setShakeToken] = useState<number | undefined>(undefined);
  const [lockoutMs, setLockoutMs] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const shakeCounter = useRef(0);

  // Re-arm any cooldown that was still running when the app was closed.
  useEffect(() => {
    getRemainingLockoutMs().then(setLockoutMs);
  }, []);

  useEffect(() => {
    if (lockoutMs <= 0) return;
    const id = setInterval(() => {
      setLockoutMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(id);
          setMessage(null);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutMs]);

  const fail = useCallback((text: string) => {
    shakeCounter.current += 1;
    setShakeToken(shakeCounter.current);
    setMessage(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setEntry('');
  }, []);

  const submit = useCallback(
    async (pin: string) => {
      setIsChecking(true);
      try {
        const result = await verifyPin(pin);
        if (result.ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setEntry('');
          setMessage(null);
          unlock();
          return;
        }
        if (result.reason === 'locked-out') {
          setLockoutMs(result.retryAfterMs);
          fail('Too many attempts.');
          return;
        }
        if (result.reason === 'no-pin') {
          // The stored credential is gone (cleared data, restored backup). Refusing
          // to open would strand the user in an unopenable app, so let them through.
          unlock();
          return;
        }
        fail(
          result.attemptsRemaining === 1
            ? 'Incorrect PIN. 1 attempt left.'
            : `Incorrect PIN. ${result.attemptsRemaining} attempts left.`
        );
      } finally {
        setIsChecking(false);
      }
    },
    [fail, unlock]
  );

  const handleChange = useCallback(
    (next: string) => {
      if (lockoutMs > 0) return;
      setEntry(next);
      if (message) setMessage(null);
      if (next.length === settings.pinLength) {
        void submit(next);
      }
    },
    [lockoutMs, message, settings.pinLength, submit]
  );

  const isBlocked = lockoutMs > 0 || isChecking;

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(220)}
      style={{ ...StyleSheetAbsoluteFill, backgroundColor: palette.background }}
    >
      <SafeAreaView className="flex-1 items-center justify-center px-6">
        <View
          className="w-16 h-16 rounded-3xl items-center justify-center mb-5"
          style={{ backgroundColor: palette.pillMuted }}
        >
          <Lock size={26} color={palette.textMuted} />
        </View>

        <Text className={`text-xl ${typeface.semibold} mb-0.5`} style={{ color: palette.text }}>
          Smaran
        </Text>
        <Text
          className={`text-xs ${typeface.regular} mb-8 tracking-wide`}
          style={{ color: palette.textMuted }}
        >
          Remember what matters
        </Text>
        <Text
          className={`text-sm ${typeface.regular} mb-10 text-center`}
          style={{ color: palette.textMuted }}
        >
          {lockoutMs > 0 ? `Try again in ${formatCountdown(lockoutMs)}` : 'Enter your PIN to continue'}
        </Text>

        <PinPad
          value={entry}
          onChange={handleChange}
          length={settings.pinLength}
          shakeToken={shakeToken}
          disabled={isBlocked}
          palette={palette}
          accent="#7A967A"
        />

        <View className="h-8 mt-5 justify-center">
          {message !== null && (
            <Animated.Text
              entering={FadeIn.duration(140)}
              className={`text-sm ${typeface.medium} text-center`}
              style={{ color: '#C46A6A' }}
              accessibilityLiveRegion="polite"
            >
              {message}
            </Animated.Text>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

/** Inlined to avoid importing StyleSheet purely for absoluteFillObject. */
const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 100,
};
