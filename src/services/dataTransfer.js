// Taking your data with you. The privacy note in this app says the data is
// yours; until this existed that was a claim with nothing behind it.

import { SCHEMA_VERSION } from '../redux/migrations';
import { MICRO_KEYS } from '../data/micros';
import { toCSV } from '../utils/csv';
import { todayISO } from '../utils/date';

export const EXPORT_FORMAT = 'bitewise-export';

export const EXPORTED_SLICES = ['user', 'nutrition', 'health', 'fitness', 'meal', 'recipe', 'chat', 'social', 'goals'];

export const CSV_COLUMNS = [
  { key: 'date', label: 'date' },
  { key: 'calories', label: 'calories' },
  { key: 'protein', label: 'protein_g' },
  { key: 'carbs', label: 'carbs_g' },
  { key: 'fat', label: 'fat_g' },
  { key: 'water', label: 'water_ml' },
  ...MICRO_KEYS.map((key) => ({ key, label: key })),
];

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function dayRows(state) {
  const nutrition = state?.nutrition || {};
  const days = [...(nutrition.history || [])];
  if (nutrition.dailyLog?.date) days.push(nutrition.dailyLog);

  return days
    .map((day) => ({
      date: day.date,
      calories: Math.round(num(day.totals?.calories)),
      protein: num(day.totals?.protein),
      carbs: num(day.totals?.carbs),
      fat: num(day.totals?.fat),
      water: Math.round(num(day.water)),
      ...MICRO_KEYS.reduce((acc, key) => {
        acc[key] = num(day.micros?.[key]);
        return acc;
      }, {}),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildExport(state, account = {}) {
  const data = {};
  for (const slice of EXPORTED_SLICES) {
    if (state?.[slice]) data[slice] = state[slice];
  }

  return {
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    account: { name: account.name || '', email: account.email || '' },
    data,
  };
}

export function exportToJSON(state, account) {
  return JSON.stringify(buildExport(state, account), null, 2);
}

export function exportToCSV(state) {
  return toCSV(dayRows(state), CSV_COLUMNS);
}

/**
 * Validates before anything touches state. A file from a newer version of the
 * app is rejected with a readable reason rather than half-imported.
 */
export function importFromJSON(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }

  if (!payload || payload.format !== EXPORT_FORMAT) {
    return { ok: false, error: 'That is not a BiteWise backup file.' };
  }

  const version = Number(payload.schemaVersion);
  if (!Number.isFinite(version)) {
    return { ok: false, error: 'The backup is missing a schema version.' };
  }
  if (version > SCHEMA_VERSION) {
    return {
      ok: false,
      error: `That backup was made by a newer version of the app (v${version}). Update first.`,
    };
  }

  if (!payload.data || typeof payload.data !== 'object') {
    return { ok: false, error: 'The backup contains no data.' };
  }

  return { ok: true, data: payload.data, exportedAt: payload.exportedAt || null, version };
}

export function summariseImport(data) {
  const days = [...(data?.nutrition?.history || []), ...(data?.nutrition?.dailyLog ? [data.nutrition.dailyLog] : [])]
    .map((day) => day?.date)
    .filter(Boolean)
    .sort();

  return {
    days: days.length,
    meals: (data?.nutrition?.dailyLog?.meals || []).length,
    goals: (data?.goals?.items || []).length,
    firstDate: days[0] || null,
    lastDate: days[days.length - 1] || null,
  };
}

export const exportFileName = (extension) => `bitewise-${todayISO()}.${extension}`;
