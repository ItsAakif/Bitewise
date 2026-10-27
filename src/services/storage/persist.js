// AsyncStorage adapter. Every read and write is total: a corrupt or missing
// value returns the caller's fallback instead of throwing into a reducer.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS, fullKey, NAMESPACE } from './keys';

export { KEYS };

export async function readJSON(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(fullKey(key));
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(fullKey(key), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function remove(key) {
  try {
    await AsyncStorage.removeItem(fullKey(key));
    return true;
  } catch {
    return false;
  }
}

export async function clearAll() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(NAMESPACE));
    if (ours.length) await AsyncStorage.multiRemove(ours);
    return true;
  } catch {
    return false;
  }
}
