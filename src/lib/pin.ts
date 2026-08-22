import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { sha256 } from 'js-sha256';

const HASH_KEY = 'remember_pin_hash';
const SALT_KEY = 'remember_pin_salt';
const LOCKOUT_KEY = 'remember_pin_lockout';

/** Android Keystore alias for the PIN entries. */
const KEYCHAIN_SERVICE = 'remember.pin';

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

/**
 * Rounds of SHA-256 applied when deriving the stored hash.
 *
 * Stretching a 4-6 digit PIN is weak protection on its own -- the keyspace is at
 * most a million -- so the real defence is that the salt and hash live in
 * SecureStore, backed by the Android Keystore. Treat this gate as protection
 * against someone picking up an unlocked phone, not against an attacker with a
 * forensic image of the device.
 */
const DERIVATION_ROUNDS = 1000;

/** Failed attempts allowed before a cooldown begins. */
const FREE_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000;
const MAX_LOCKOUT_MS = 15 * 60_000;

interface LockoutState {
  failures: number;
  /** Epoch ms until which unlocking is refused. */
  until: number;
}

const NO_LOCKOUT: LockoutState = { failures: 0, until: 0 };

/**
 * Hashed in JavaScript rather than through `expo-crypto`.
 *
 * `digestStringAsync` is one round-trip across the native bridge per call, so a
 * thousand rounds cost seconds of visible wait on the lock screen before the app
 * appeared. The same thousand rounds run in single-digit milliseconds here.
 *
 * `js-sha256` produces the identical lowercase-hex digest of the same UTF-8
 * bytes, so PINs stored by the previous implementation still verify and no
 * migration is needed.
 */
function deriveHash(pin: string, salt: string): string {
  let digest = `${salt}:${pin}`;
  for (let i = 0; i < DERIVATION_ROUNDS; i++) {
    digest = sha256(digest);
  }
  return digest;
}

/** Length-independent comparison, so timing can't leak how much of the hash matched. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isValidPinFormat(pin: string): boolean {
  return (
    pin.length >= PIN_MIN_LENGTH &&
    pin.length <= PIN_MAX_LENGTH &&
    /^[0-9]+$/.test(pin)
  );
}

/** True when SecureStore is usable; without it a PIN cannot be stored safely. */
export async function isSecureStorageAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function hasPin(): Promise<boolean> {
  try {
    const hash = await SecureStore.getItemAsync(HASH_KEY, { keychainService: KEYCHAIN_SERVICE });
    return hash !== null;
  } catch {
    return false;
  }
}

/** Stores a new PIN, replacing any existing one and clearing lockout state. */
export async function setPin(pin: string): Promise<void> {
  if (!isValidPinFormat(pin)) {
    throw new Error(`PIN must be ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digits.`);
  }
  const salt = randomUUID();
  const hash = deriveHash(pin, salt);
  await SecureStore.setItemAsync(SALT_KEY, salt, { keychainService: KEYCHAIN_SERVICE });
  await SecureStore.setItemAsync(HASH_KEY, hash, { keychainService: KEYCHAIN_SERVICE });
  await resetLockout();
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(HASH_KEY, { keychainService: KEYCHAIN_SERVICE }).catch(() => {});
  await SecureStore.deleteItemAsync(SALT_KEY, { keychainService: KEYCHAIN_SERVICE }).catch(() => {});
  await resetLockout();
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'wrong'; attemptsRemaining: number }
  | { ok: false; reason: 'locked-out'; retryAfterMs: number }
  | { ok: false; reason: 'no-pin' };

/**
 * Checks a PIN, applying an escalating cooldown after repeated failures so the
 * small keyspace can't simply be enumerated by hand.
 */
export async function verifyPin(pin: string): Promise<VerifyResult> {
  const lockout = await getLockout();
  const now = Date.now();
  if (lockout.until > now) {
    return { ok: false, reason: 'locked-out', retryAfterMs: lockout.until - now };
  }

  let salt: string | null = null;
  let expected: string | null = null;
  try {
    salt = await SecureStore.getItemAsync(SALT_KEY, { keychainService: KEYCHAIN_SERVICE });
    expected = await SecureStore.getItemAsync(HASH_KEY, { keychainService: KEYCHAIN_SERVICE });
  } catch {
    return { ok: false, reason: 'no-pin' };
  }
  if (!salt || !expected) return { ok: false, reason: 'no-pin' };

  const actual = deriveHash(pin, salt);
  if (constantTimeEquals(actual, expected)) {
    await resetLockout();
    return { ok: true };
  }

  const failures = lockout.failures + 1;
  if (failures >= FREE_ATTEMPTS) {
    const overage = failures - FREE_ATTEMPTS;
    const penalty = Math.min(BASE_LOCKOUT_MS * 2 ** overage, MAX_LOCKOUT_MS);
    await saveLockout({ failures, until: Date.now() + penalty });
    return { ok: false, reason: 'locked-out', retryAfterMs: penalty };
  }

  await saveLockout({ failures, until: 0 });
  return { ok: false, reason: 'wrong', attemptsRemaining: FREE_ATTEMPTS - failures };
}

/* -------------------------------- lockout -------------------------------- */

export async function getLockout(): Promise<LockoutState> {
  try {
    const raw = await AsyncStorage.getItem(LOCKOUT_KEY);
    if (!raw) return NO_LOCKOUT;
    const parsed = JSON.parse(raw) as LockoutState;
    if (typeof parsed.failures !== 'number' || typeof parsed.until !== 'number') return NO_LOCKOUT;
    return parsed;
  } catch {
    return NO_LOCKOUT;
  }
}

async function saveLockout(state: LockoutState): Promise<void> {
  await AsyncStorage.setItem(LOCKOUT_KEY, JSON.stringify(state)).catch(() => {});
}

async function resetLockout(): Promise<void> {
  await AsyncStorage.removeItem(LOCKOUT_KEY).catch(() => {});
}

/** Remaining cooldown in ms, or 0 when unlocking is currently allowed. */
export async function getRemainingLockoutMs(): Promise<number> {
  const { until } = await getLockout();
  return Math.max(0, until - Date.now());
}
