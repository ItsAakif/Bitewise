// Meal Memory: reusable meals built from what the user actually ate.
//
// Not "favourite catalogue entries" — a template holds the exact items, portions
// and quantities of a meal the user logged, so repeating it is one tap and
// reproduces the same numbers. The app learns the user's meals without a model
// and without sending anything anywhere.

import { uid } from './id';
import { sumItems } from './nutrition';

/** Merge the meals of one type into a single template payload. */
export function buildTemplate(meals, { name, type }) {
  const items = (meals || [])
    .filter((meal) => !type || meal.type === type)
    .flatMap((meal) => meal.items || []);

  if (!items.length) return null;

  return {
    id: uid('tpl'),
    name: String(name || '').trim() || defaultName(type),
    type: type || 'snack',
    items: items.map((item) => ({ ...item })),
    total: sumItems(items),
    createdAt: new Date().toISOString(),
    uses: 0,
  };
}

export function defaultName(type) {
  const label = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  return `My usual ${(label[type] || 'meal').toLowerCase()}`;
}

/**
 * Recently eaten items, most recent first, de-duplicated by name. Used to offer
 * "repeat yesterday's breakfast" without any template being saved first.
 */
export function recentMeals(history, dailyLog, { limit = 6 } = {}) {
  const days = [dailyLog, ...(history || [])].filter(Boolean);
  const seen = new Set();
  const out = [];

  for (const day of days) {
    for (const meal of [...(day.meals || [])].reverse()) {
      const key = `${meal.type}|${(meal.items || []).map((item) => item.name).join('+')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        type: meal.type,
        items: meal.items || [],
        total: meal.total,
        date: day.date,
      });
      if (out.length >= limit) return out;
    }
  }

  return out;
}

/** A meal type's total across every logged meal of that type that day. */
export function itemsForType(meals, type) {
  return (meals || [])
    .filter((meal) => meal.type === type)
    .flatMap((meal) => meal.items || []);
}
