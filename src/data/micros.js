// The twelve micronutrients this app tracks. Grams for the sugars and fibre,
// milligrams for the minerals, micrograms for B12, folate and vitamin D — the
// units Indian food tables use.

export const MICRO_KEYS = [
  'fiber',
  'sugar',
  'sodium',
  'calcium',
  'iron',
  'zinc',
  'magnesium',
  'potassium',
  'vitaminC',
  'vitaminB12',
  'folate',
  'vitaminD',
];

export const MICRO_UNITS = {
  fiber: 'g',
  sugar: 'g',
  sodium: 'mg',
  calcium: 'mg',
  iron: 'mg',
  zinc: 'mg',
  magnesium: 'mg',
  potassium: 'mg',
  vitaminC: 'mg',
  vitaminB12: 'µg',
  folate: 'µg',
  vitaminD: 'µg',
};

export const MICRO_LABELS = {
  fiber: 'Fibre',
  sugar: 'Sugar',
  sodium: 'Sodium',
  calcium: 'Calcium',
  iron: 'Iron',
  zinc: 'Zinc',
  magnesium: 'Magnesium',
  potassium: 'Potassium',
  vitaminC: 'Vitamin C',
  vitaminB12: 'Vitamin B12',
  folate: 'Folate',
  vitaminD: 'Vitamin D',
};

/** Nutrients that are targets to reach rather than limits to stay under. */
export const MICRO_GOALS = ['fiber', 'calcium', 'iron', 'zinc', 'magnesium', 'potassium', 'vitaminC', 'vitaminB12', 'folate', 'vitaminD'];

/** Nutrients where less is better. */
export const MICRO_LIMITS = ['sugar', 'sodium'];

export const zeros = () =>
  MICRO_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function addMicros(a, b) {
  const out = zeros();
  for (const key of MICRO_KEYS) out[key] = Math.round((num(a?.[key]) + num(b?.[key])) * 10) / 10;
  return out;
}

export function sumMicros(list = []) {
  return list.reduce((acc, entry) => addMicros(acc, entry), zeros());
}

export function scaleMicros(micros, factor) {
  const f = num(factor) || 1;
  const out = zeros();
  for (const key of MICRO_KEYS) out[key] = Math.round(num(micros?.[key]) * f * 10) / 10;
  return out;
}

/** True when at least one nutrient is known — 0 across the board means unknown. */
export function hasMicros(micros) {
  if (!micros) return false;
  return MICRO_KEYS.some((key) => num(micros[key]) > 0);
}

/** Form metadata for editing a food's micronutrients. */
export const MICRO_FIELDS = [
  { key: 'fiber', label: 'Fibre', unit: 'g', max: 100, step: 1 },
  { key: 'sugar', label: 'Sugar', unit: 'g', max: 200, step: 1 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', max: 5000, step: 10 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', max: 2000, step: 10 },
  { key: 'iron', label: 'Iron', unit: 'mg', max: 100, step: 0.5 },
  { key: 'zinc', label: 'Zinc', unit: 'mg', max: 100, step: 0.5 },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', max: 1000, step: 5 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', max: 6000, step: 10 },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', max: 1000, step: 1 },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'µg', max: 100, step: 0.1 },
  { key: 'folate', label: 'Folate', unit: 'µg', max: 1500, step: 5 },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', max: 100, step: 0.5 },
];
