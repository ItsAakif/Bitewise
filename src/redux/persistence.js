/* global setTimeout, clearTimeout */
// Persistence. State is written to AsyncStorage after a short debounce, one key
// per slice, so a crash mid-write costs at most the last few hundred
// milliseconds of input rather than the whole day.

import { KEYS, readJSON, writeJSON, remove } from '../services/storage/persist';
import { hydrateApp } from './actions';
import { SCHEMA_VERSION, migrateSlice } from './migrations';

export const PERSISTED_SLICES = [
  'user',
  'nutrition',
  'health',
  'fitness',
  'meal',
  'recipe',
  'chat',
  'social',
  'goals',
];

export async function loadPersistedState() {
  const storedVersion = Number(await readJSON(KEYS.schemaVersion, 1)) || 1;
  const pairs = await Promise.all(
    PERSISTED_SLICES.map(async (slice) => [slice, await readJSON(KEYS[slice], null)])
  );

  const state = {};
  for (const [slice, value] of pairs) {
    if (!value || typeof value !== 'object') continue;
    const migrated = storedVersion < SCHEMA_VERSION ? migrateSlice(slice, value) : value;
    if (migrated && typeof migrated === 'object') state[slice] = migrated;
  }

  if (storedVersion < SCHEMA_VERSION) {
    // Persist the migrated shape immediately so a crash after boot cannot leave
    // half the slices on the old schema.
    await Promise.all(
      Object.entries(state).map(([slice, value]) => writeJSON(KEYS[slice], value))
    );
    await writeJSON(KEYS.schemaVersion, SCHEMA_VERSION);
  }

  return state;
}

export function hydrateFromPersisted(persisted) {
  return hydrateApp(persisted);
}

/**
 * Removes app data but keeps the account records and the session key, so
 * signing out does not delete the account you just signed out of.
 */
export async function clearPersistedState() {
  await Promise.all(PERSISTED_SLICES.map((slice) => remove(KEYS[slice])));
}

let attached = false;
let timer = null;
let dirty = new Set();

export function attachPersistence(store) {
  if (attached) return () => {};
  attached = true;

  let previous = store.getState();

  const unsubscribe = store.subscribe(() => {
    const current = store.getState();
    if (current === previous) return;

    let changed = false;
    for (const slice of PERSISTED_SLICES) {
      if (current[slice] !== previous[slice]) {
        dirty.add(slice);
        changed = true;
      }
    }
    previous = current;
    if (!changed) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const snapshot = store.getState();
      const pending = [...dirty];
      dirty = new Set();
      await Promise.all(pending.map((slice) => writeJSON(KEYS[slice], snapshot[slice])));
    }, 400);
  });

  return () => {
    if (timer) clearTimeout(timer);
    attached = false;
    unsubscribe();
  };
}
