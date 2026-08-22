import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import * as settingsStorage from '../lib/settingsStorage';
import { scheduleDailyReminder } from '../lib/reminders';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  /**
   * False until stored settings have been read. Consumers that gate the UI --
   * the PIN lock in particular -- must wait for this, or they will briefly act
   * on defaults and flash unlocked content before the real settings arrive.
   */
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    settingsStorage.loadSettings().then(loaded => {
      setSettings(loaded);
      setIsLoaded(true);
      // Re-arm the OS-level schedule on app open (survives most reboots, but not all).
      if (loaded.reminderEnabled) {
        scheduleDailyReminder(loaded.reminderTime).catch(() => {});
      }
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      settingsStorage.saveSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
