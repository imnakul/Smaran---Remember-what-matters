import { Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { Lora_400Regular, Lora_500Medium, Lora_600SemiBold } from '@expo-google-fonts/lora';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Caveat_400Regular,
  Caveat_500Medium,
  Caveat_600SemiBold,
} from '@expo-google-fonts/caveat';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShareIntentProvider } from 'expo-share-intent';
import { SettingsProvider } from '../src/context/SettingsContext';
import { LockProvider, useLock } from '../src/context/LockContext';
import { ConnectivityProvider } from '../src/context/ConnectivityContext';
import { SyncProvider } from '../src/context/SyncContext';
import { LockScreen } from '../src/components/LockScreen';
import { AnimatedSplash } from '../src/components/AnimatedSplash';
import { PrivacyScreenGuard } from '../src/components/PrivacyScreenGuard';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import '../global.css';

// Expo Go blocks remote push-token registration (SDK 53+) and splash options.
LogBox.ignoreLogs(['Android Push notifications', 'Splashscreen.setOptions', 'SplashScreen.setOptions']);

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    SplashScreen.setOptions({
      duration: 120,
      fade: true,
    });
  } catch {}
}

/**
 * Holds the splash screen until both the fonts and the lock decision are ready,
 * then renders the app with the PIN gate layered on top.
 *
 * Keeping the splash up until `isReady` is what prevents a frame of unlocked
 * content from painting before the gate mounts. Once ready, the native splash
 * hands off to `AnimatedSplash`, which paints the same frame and animates out.
 */
function Shell({ fontsReady }: { fontsReady: boolean }) {
  const { isLocked, isReady } = useLock();
  const [splashDone, setSplashDone] = useState(false);

  const isBooted = fontsReady && isReady;

  useEffect(() => {
    if (isBooted) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isBooted]);

  if (!isBooted) return null;

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      {isLocked && <LockScreen />}
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </>
  );
}

export default function RootLayout() {
  /**
   * Every selectable family is loaded up front rather than on demand.
   *
   * Switching typeface has to be instant and has to work offline, and a font
   * that is merely *referenced* before it finishes registering falls back to the
   * system face -- which would show up as a flash of the wrong type on every
   * change. Four families at three weights is a one-off cost paid at splash.
   */
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    Caveat_400Regular,
    Caveat_500Medium,
    Caveat_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
  });

  return (
    <ShareIntentProvider options={{ resetOnBackground: true }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SettingsProvider>
          <ConnectivityProvider>
            <SyncProvider>
              <LockProvider>
                <SafeAreaProvider>
                  <PrivacyScreenGuard />
                  <Shell fontsReady={loaded || error !== null} />
                </SafeAreaProvider>
              </LockProvider>
            </SyncProvider>
          </ConnectivityProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </ShareIntentProvider>
  );
}
