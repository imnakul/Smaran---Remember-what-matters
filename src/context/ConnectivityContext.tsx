import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import * as Network from 'expo-network';

interface ConnectivityContextValue {
  /** True when the device has a connection the app can reasonably try to use. */
  isOnline: boolean;
  /** Flips to true on each offline -> online edge, so callers can retry queued work. */
  reconnectToken: number;
}

const ConnectivityContext = createContext<ConnectivityContextValue | undefined>(undefined);

/**
 * Tracks network reachability for the offline indicator and the sync engine.
 *
 * `isInternetReachable` is undefined until the platform finishes its probe, and
 * treating that as offline would make the app flash an offline badge on every
 * cold start. It only counts as offline once the probe explicitly reports false.
 */
export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const state = Network.useNetworkState();
  const [reconnectToken, setReconnectToken] = useState(0);

  const isOnline = state.isConnected === true && state.isInternetReachable !== false;
  const wasOnline = useRef(isOnline);

  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      setReconnectToken(t => t + 1);
    }
    wasOnline.current = isOnline;
  }, [isOnline]);

  return (
    <ConnectivityContext.Provider value={{ isOnline, reconnectToken }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity(): ConnectivityContextValue {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) throw new Error('useConnectivity must be used within a ConnectivityProvider');
  return ctx;
}
