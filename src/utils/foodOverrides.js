// Editing the built-in catalogue.
//
// The shipped values are typical values for a stated serving, not measurements of
// the food in front of you. When someone knows better — their brand of paneer,
// their mother's rajma — they should be able to correct the row without creating
// a duplicate food. Overrides live separately from the catalogue so a data update
// in a future release never silently discards their correction.

import { MICRO_KEYS } from '../data/micros';

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Applies a stored override to a catalogue food. */
export function applyOverride(food, overrides) {
  if (!food) return food;
  const override = overrides?.[food.id];
  if (!override) return food;

  return {
    ...food,
    ...('serving' in override ? { serving: override.serving } : {}),
    calories: override.calories != null ? num(override.calories) : food.calories,
    protein: override.protein != null ? num(override.protein) : food.protein,
    carbs: override.carbs != null ? num(override.carbs) : food.carbs,
    fat: override.fat != null ? num(override.fat) : food.fat,
    micros: override.micros ? { ...(food.micros || {}), ...override.micros } : food.micros,
    edited: true,
  };
}

/** Applies overrides across a list, e.g. the search catalogue. */
export function applyOverrides(foods, overrides) {
  if (!overrides || !Object.keys(overrides).length) return foods;
  return foods.map((food) => applyOverride(food, overrides));
}

export function hasOverride(overrides, foodId) {
  return Boolean(overrides?.[foodId]);
}

/** Normalises a patch from the edit form before it goes into state. */
export function normaliseOverride(form) {
  const patch = {
    calories: Math.max(0, num(form.calories)),
    protein: Math.max(0, num(form.protein)),
    carbs: Math.max(0, num(form.carbs)),
    fat: Math.max(0, num(form.fat)),
  };

  if (form.serving && String(form.serving).trim()) {
    patch.serving = String(form.serving).trim();
  }

  const micros = {};
  for (const key of MICRO_KEYS) {
    const value = Number(form[key]);
    if (Number.isFinite(value) && value > 0) micros[key] = value;
  }
  if (Object.keys(micros).length) patch.micros = micros;

  return patch;
}
