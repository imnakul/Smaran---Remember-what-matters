import { View, Text, Modal, Pressable, Alert } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PinPad } from './PinPad';
import { NEUTRAL } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { setPin, clearPin, verifyPin, isSecureStorageAvailable } from '../lib/pin';
import { useTypeface } from '../hooks/useTypeface';

export type PinSetupMode = 'set' | 'change' | 'remove';

interface PinSetupModalProps {
  visible: boolean;
  mode: PinSetupMode;
  onClose: () => void;
}

type Step = 'verify-current' | 'choose-length' | 'enter' | 'confirm';

const LENGTH_OPTIONS = [4, 6];

function initialStep(mode: PinSetupMode): Step {
  return mode === 'set' ? 'choose-length' : 'verify-current';
}

/**
 * Guided flow for setting, changing, and removing the app PIN.
 *
 * Changing or removing always re-verifies the current PIN first, so someone
 * handed an already-unlocked phone cannot quietly take the lock off.
 */
export function PinSetupModal({ visible, mode, onClose }: PinSetupModalProps) {
  const typeface = useTypeface();
  const { settings, updateSettings } = useSettings();
  const palette = settings.darkMode ? NEUTRAL.dark : NEUTRAL.light;

  const [step, setStep] = useState<Step>(initialStep(mode));
  const [length, setLength] = useState(settings.pinLength);
  const [entry, setEntry] = useState('');
  const [firstEntry, setFirstEntry] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [shakeToken, setShakeToken] = useState<number | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);
  const shakeCounter = useRef(0);

  // Reset to a clean state each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setStep(initialStep(mode));
    setLength(settings.pinLength);
    setEntry('');
    setFirstEntry('');
    setMessage(null);
  }, [visible, mode, settings.pinLength]);

  const fail = useCallback((text: string) => {
    shakeCounter.current += 1;
    setShakeToken(shakeCounter.current);
    setMessage(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setEntry('');
  }, []);

  const finishRemove = useCallback(async () => {
    await clearPin();
    updateSettings({ pinEnabled: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }, [onClose, updateSettings]);

  const finishSet = useCallback(
    async (pin: string) => {
      const available = await isSecureStorageAvailable();
      if (!available) {
        Alert.alert(
          'Secure storage unavailable',
          'This device will not let Smaran store a PIN safely, so the lock cannot be enabled.'
        );
        onClose();
        return;
      }
      await setPin(pin);
      updateSettings({ pinEnabled: true, pinLength: pin.length });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    },
    [onClose, updateSettings]
  );

  const handleComplete = useCallback(
    async (pin: string) => {
      setIsBusy(true);
      try {
        if (step === 'verify-current') {
          const result = await verifyPin(pin);
          if (!result.ok) {
            fail(result.reason === 'locked-out' ? 'Too many attempts. Try again later.' : 'Incorrect PIN.');
            return;
          }
          setEntry('');
          if (mode === 'remove') {
            await finishRemove();
          } else {
            setMessage(null);
            setStep('choose-length');
          }
          return;
        }

        if (step === 'enter') {
          setFirstEntry(pin);
          setEntry('');
          setMessage(null);
          setStep('confirm');
          return;
        }

        if (step === 'confirm') {
          if (pin !== firstEntry) {
            fail('Those did not match. Start again.');
            setFirstEntry('');
            setStep('enter');
            return;
          }
          await finishSet(pin);
        }
      } finally {
        setIsBusy(false);
      }
    },
    [step, mode, firstEntry, fail, finishRemove, finishSet]
  );

  const handleChange = useCallback(
    (next: string) => {
      setEntry(next);
      if (message) setMessage(null);
      const expected = step === 'verify-current' ? settings.pinLength : length;
      if (next.length === expected) {
        void handleComplete(next);
      }
    },
    [message, step, settings.pinLength, length, handleComplete]
  );

  const title =
    step === 'verify-current'
      ? 'Enter your current PIN'
      : step === 'choose-length'
        ? 'Choose a PIN length'
        : step === 'enter'
          ? 'Choose a new PIN'
          : 'Confirm your new PIN';

  const subtitle =
    step === 'verify-current'
      ? mode === 'remove'
        ? 'Confirm it is you before turning the lock off.'
        : 'Confirm it is you before changing the PIN.'
      : step === 'choose-length'
        ? 'Longer PINs are harder to guess.'
        : step === 'enter'
          ? `Pick ${length} digits you will remember.`
          : 'Enter it once more.';

  const padLength = step === 'verify-current' ? settings.pinLength : length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView className="flex-1" style={{ backgroundColor: palette.background }}>
        <View className="flex-row justify-end px-4 pt-2">
          <Pressable onPress={onClose} accessibilityRole="button" aria-label="Cancel" className="p-2">
            <X size={22} color={palette.textMuted} />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className={`text-xl ${typeface.semibold} mb-1.5 text-center`} style={{ color: palette.text }}>
            {title}
          </Text>
          <Text
            className={`text-sm ${typeface.regular} mb-10 text-center`}
            style={{ color: palette.textMuted }}
          >
            {subtitle}
          </Text>

          {step === 'choose-length' ? (
            <View className="flex-row gap-3">
              {LENGTH_OPTIONS.map(option => (
                <Pressable
                  key={option}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLength(option);
                    setEntry('');
                    setStep('enter');
                  }}
                  accessibilityRole="button"
                  aria-label={`${option} digit PIN`}
                  className="px-7 py-4 rounded-2xl"
                  style={{ backgroundColor: palette.pillMuted }}
                >
                  <Text className={`text-base ${typeface.semibold}`} style={{ color: palette.text }}>
                    {option} digits
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <PinPad
              value={entry}
              onChange={handleChange}
              length={padLength}
              shakeToken={shakeToken}
              disabled={isBusy}
              palette={palette}
              accent="#7A967A"
            />
          )}

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
        </View>
      </SafeAreaView>
    </Modal>
  );
}
