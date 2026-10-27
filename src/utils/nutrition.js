// Macro maths. Every number shown against a target comes through here, so the
// Today, Diary, Stats and Goals screens can never disagree about a percentage.

import { addDays, todayISO } from './date';
import { zeros, scaleMicros, sumMicros as sumMicrosOf, hasMicros } from '../data/micros';
import { gramsFromServing } from './portions';

export const EMPTY_MACROS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function sumItems(items = []) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + num(item.calories),
      protein: acc.protein + num(item.protein),
      carbs: acc.carbs + num(item.carbs),
      fat: acc.fat + num(item.fat),
    }),
    { ...EMPTY_MACROS }
  );
}

export function sumMeals(meals = []) {
  return meals.reduce(
    (acc, meal) => {
      const t = sumItems(meal.items);
      return {
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      };
    },
    { ...EMPTY_MACROS }
  );
}

/** Micronutrients for a list of items, summing only the nutrients that are known. */
export function sumItemMicros(items = []) {
  return sumMicrosOf(items.map((item) => item.micros));
}

/** True when at least one item in the list carried micronutrient data. */
export function microsCoverage(items = []) {
  if (!items.length) return 0;
  const known = items.filter((item) => item.microsKnown !== false).length;
  return known / items.length;
}

/** Clamped 0..100. A target of zero is 0%, never Infinity or NaN. */
export function percent(value, target) {
  const t = num(target);
  if (t <= 0) return 0;
  const p = (num(value) / t) * 100;
  return Math.max(0, Math.min(100, Math.round(p)));
}

/**
 * Scales a catalogue food into a loggable item. `base` keeps the per-unit
 * macros so a later quantity change is recomputed from the original number
 * instead of compounding rounding on an already-rounded one. `baseMicros` does
 * the same for micronutrients; when the food has none, `microsKnown` is false so
 * the UI can say "unknown" rather than showing a confident zero.
 */
export function scaleFood(food, quantity = 1, idSuffix = '') {
  const q = num(quantity) || 1;
  const base = {
    calories: num(food.calories),
    protein: num(food.protein),
    carbs: num(food.carbs),
    fat: num(food.fat),
  };
  const microsKnown = hasMicros(food.micros);
  const baseMicros = microsKnown ? { ...zeros(), ...food.micros } : null;

  return {
    id: `${food.id || food.foodId || 'item'}${idSuffix !== '' ? `-${idSuffix}` : ''}`,
    foodId: food.id || food.foodId || '',
    name: food.name,
    serving: food.serving || '1 serving',
    quantity: q,
    calories: round1(base.calories * q),
    protein: round1(base.protein * q),
    carbs: round1(base.carbs * q),
    fat: round1(base.fat * q),
    micros: baseMicros ? scaleMicros(baseMicros, q) : zeros(),
    microsKnown,
    portionLabel: '',
    grams: gramsFromServing(food.serving),
    base,
    baseMicros,
  };
}

/** Recomputes an item's macros for a new quantity from its per-unit baseline. */
export function requantify(item, quantity) {
  const q = num(quantity) || 1;
  const base = item.base || {
    calories: num(item.calories) / (num(item.quantity) || 1),
    protein: num(item.protein) / (num(item.quantity) || 1),
    carbs: num(item.carbs) / (num(item.quantity) || 1),
    fat: num(item.fat) / (num(item.quantity) || 1),
  };
  return {
    ...item,
    quantity: q,
    calories: round1(base.calories * q),
    protein: round1(base.protein * q),
    carbs: round1(base.carbs * q),
    fat: round1(base.fat * q),
    micros: item.baseMicros ? scaleMicros(item.baseMicros, q) : zeros(),
    base,
  };
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function glasses(ml) {
  return Math.round(num(ml) / 250);
}

export function formatMacro(n) {
  const v = num(n);
  return v < 10 ? String(round1(v)) : String(Math.round(v));
}

export function formatCalories(n) {
  return String(Math.round(num(n)));
}

/**
 * Consecutive days with an entry, ending today or yesterday. Today counts as
 * part of the streak but an unlogged today does not break a streak that ran to
 * yesterday — otherwise every streak reads zero in the morning.
 */
export function streakFromHistory(history = []) {
  const logged = new Set(history.map((d) => d.date));
  const today = todayISO();
  let cursor = logged.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (logged.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Chronological series (oldest first, today last) for the last `days` days.
 * Days with no record are zero-filled so a chart keeps a constant width.
 * @param {import('../types').DaySummary[]} history newest-first archive
 * @param {import('../types').DailyLog|null} dailyLog today's log
 */
export function seriesFromHistory(history = [], dailyLog = null, days = 7) {
  const today = todayISO();
  const byDate = new Map();
  for (const day of history) {
    byDate.set(day.date, {
      date: day.date,
      calories: num(day.totals?.calories),
      protein: num(day.totals?.protein),
      carbs: num(day.totals?.carbs),
      fat: num(day.totals?.fat),
      water: num(day.water),
    });
  }
  if (dailyLog && dailyLog.date) {
    byDate.set(dailyLog.date, {
      date: dailyLog.date,
      calories: num(dailyLog.totals?.calories),
      protein: num(dailyLog.totals?.protein),
      carbs: num(dailyLog.totals?.carbs),
      fat: num(dailyLog.totals?.fat),
      water: num(dailyLog.water),
    });
  }
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const found = byDate.get(date);
    out.push(
      found
        ? { ...found }
        : { date, calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
    );
  }
  // Built from oldest to newest so a chart reads left to right.
  return out;
}

export function averageOf(series = [], key) {
  if (!series.length) return 0;
  const total = series.reduce((sum, d) => sum + num(d[key]), 0);
  return round1(total / series.length);
}

export function totalOf(series = [], key) {
  return round1(series.reduce((sum, d) => sum + num(d[key]), 0));
}
