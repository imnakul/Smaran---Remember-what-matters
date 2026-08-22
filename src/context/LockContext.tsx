import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LOCK_TIMEOUT_MS } from '../types';
import { useSettings } from './SettingsContext';

interface LockContextValue {
  /** True while the PIN gate should cover the app. */
  isLocked: boolean;
  /** False until stored settings decide the initial state; render nothing before it flips. */
  isReady: boolean;
  unlock: () => void;
  lockNow: () => void;
}

const LockContext = createContext<LockContextValue | undefined>(undefined);

export function LockProvider({ children }: { children: ReactNode }) {
  const { settings, isLoaded } = useSettings();
  const [isLocked, setIsLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  /**
   * The AppState listener is registered once and reads current settings through
   * refs. Re-subscribing whenever settings change would drop `leftAt` mid-background
   * and let a backgrounded app come back unlocked.
   */
  const pinEnabledRef = useRef(settings.pinEnabled);
  const timeoutRef = useRef(settings.lockTimeout);
  const leftAt = useRef<number | null>(null);
  const didInit = useRef(false);

  useEffect(() => {
    pinEnabledRef.current = settings.pinEnabled;
    timeoutRef.current = settings.lockTimeout;
  }, [settings.pinEnabled, settings.lockTimeout]);

  // Decide the opening state exactly once, after settings land.
  useEffect(() => {
    if (!isLoaded || didInit.current) return;
    didInit.current = true;
    setIsLocked(settings.pinEnabled);
    setIsReady(true);
  }, [isLoaded, settings.pinEnabled]);

  // Turning the PIN off must also dismiss a gate that is already showing.
  useEffect(() => {
    if (!settings.pinEnabled) setIsLocked(false);
  }, [settings.pinEnabled]);

  useEffect(() => {
    const handleChange = (next: AppStateStatus) => {
      if (next === 'active') {
        const left = leftAt.current;
        leftAt.current = null;
        if (!pinEnabledRef.current || left === null) return;
        if (Date.now() - left >= LOCK_TIMEOUT_MS[timeoutRef.current]) {
          setIsLocked(true);
        }
        return;
      }
      // Record the first departure only; Android can emit 'inactive' then 'background'.
      if (leftAt.current === null) leftAt.current = Date.now();
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, []);

  const unlock = useCallback(() => setIsLocked(false), []);
  const lockNow = useCallback(() => setIsLocked(true), []);

  return (
    <LockContext.Provider value={{ isLocked, isReady, unlock, lockNow }}>{children}</LockContext.Provider>
  );
}

export function useLock(): LockContextValue {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used within a LockProvider');
  return ctx;
}
