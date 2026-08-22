import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { SyncStatus } from '../types';
import { syncWithNotion, invalidateTargetCache } from '../lib/notionSync';
import { useSettings } from './SettingsContext';
import { useConnectivity } from './ConnectivityContext';

interface SyncContextValue {
  status: SyncStatus;
  /** ISO timestamp of the last fully successful sync, or undefined if never. */
  lastSyncedAt?: string;
  /** User-facing message from the most recent failure. */
  lastError?: string;
  /** Runs a sync now. Safe to call freely -- overlapping calls share one pass. */
  syncNow: () => Promise<void>;
  /**
   * Asks for a sync shortly after a local edit, coalescing bursts. Screens call
   * this after every mutation instead of syncing inline, so typing never waits
   * on the network.
   */
  requestSync: () => void;
  /**
   * Increments whenever a sync changed local records. Screens watch it to re-read
   * storage, since the engine writes underneath the hooks.
   */
  syncVersion: number;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/** Coalescing window for edits, long enough to absorb a burst of typing. */
const DEBOUNCE_MS = 2500;

/** Background cadence while the app is open and online. */
const INTERVAL_MS = 5 * 60_000;

/**
 * Owns the Notion sync lifecycle: when it runs, what the header pill shows, and
 * how local edits get flushed.
 *
 * Sync is never blocking. Every trigger here is opportunistic -- if the device
 * is offline or Notion is unreachable, the local database stays authoritative
 * and the work is retried on the next reconnect.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings, isLoaded } = useSettings();
  const { isOnline, reconnectToken } = useConnectivity();

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const [syncVersion, setSyncVersion] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The sync callback is rebuilt whenever settings change, but the timers and
  // listeners below must not be torn down each time -- reading through a ref
  // keeps them stable while still calling the current implementation.
  const runRef = useRef<() => Promise<void>>(async () => {});

  const dbIds = settings.notionDatabaseIds ?? {};
  const hasAnyDb = Boolean(settings.notionDatabaseId) || Object.values(dbIds).some(v => typeof v === 'string' && v.trim().length > 0);
  const enabled = settings.notionEnabled && hasAnyDb;

  const syncTargets = {
    remember: dbIds.remember ?? settings.notionDatabaseId,
    learnings: dbIds.learnings,
    blessings: dbIds.blessings,
    sayings: dbIds.sayings,
    tryDoing: dbIds.tryDoing,
  };

  const syncNow = useCallback(async () => {
    if (!enabled || !hasAnyDb) return;
    if (!isOnline) {
      setStatus('offline');
      return;
    }

    setStatus('syncing');
    const outcome = await syncWithNotion(syncTargets);

    if (!outcome.ok) {
      setLastError(outcome.error);
      setStatus('error');
      return;
    }

    setLastError(undefined);
    setStatus('synced');
    updateSettings({ notionLastSyncedAt: outcome.syncedAt });

    const changed =
      outcome.pulled > 0 || outcome.adopted > 0 || outcome.removed > 0 || outcome.pushed > 0;
    if (changed) setSyncVersion(v => v + 1);
  }, [enabled, hasAnyDb, isOnline, syncTargets, updateSettings]);

  useEffect(() => {
    runRef.current = syncNow;
  }, [syncNow]);

  const requestSync = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runRef.current();
    }, DEBOUNCE_MS);
  }, []);

  // Reflect connectivity in the pill even when no sync is running, so the user
  // can tell "not syncing because offline" from "nothing to do".
  useEffect(() => {
    if (!enabled) return;
    if (!isOnline) {
      setStatus('offline');
    } else {
      setStatus(prev => (prev === 'offline' ? 'idle' : prev));
    }
  }, [isOnline, enabled]);

  // Sync on first load, and whenever the target changes.
  useEffect(() => {
    if (!isLoaded || !enabled || !isOnline) return;
    void runRef.current();
  }, [isLoaded, enabled, isOnline, settings.notionDatabaseId, JSON.stringify(settings.notionDatabaseIds)]);

  // Drain whatever queued up while the device was offline.
  useEffect(() => {
    if (reconnectToken === 0 || !enabled) return;
    void runRef.current();
  }, [reconnectToken, enabled]);

  // A stale data source id survives a database being swapped out from under us.
  useEffect(() => {
    invalidateTargetCache();
  }, [settings.notionDatabaseId, JSON.stringify(settings.notionDatabaseIds)]);

  // Catch up on returning to the foreground, where remote edits are most likely
  // to have accumulated.
  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void runRef.current();
    });
    return () => subscription.remove();
  }, [enabled]);

  // Slow heartbeat so a long-lived session still picks up remote changes.
  useEffect(() => {
    if (!enabled || !isOnline) return;
    const id = setInterval(() => void runRef.current(), INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, isOnline]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <SyncContext.Provider
      value={{
        status: enabled ? status : 'idle',
        lastSyncedAt: settings.notionLastSyncedAt,
        lastError,
        syncNow,
        requestSync,
        syncVersion,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
}
