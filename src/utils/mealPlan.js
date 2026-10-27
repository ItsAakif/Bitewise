// Deterministic seven-day meal planning. The same week produces the same plan,
// so leaving and re-opening the screen does not reshuffle the food.

import { addDays, startOfWeekISO, todayISO } from './date';

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

const SHARE = { breakfast: 0.25, lunch: 0.3, dinner: 0.35, snack: 0.1 };

const SLOT_TAGS = {
  breakfast: ['breakfast'],
  lunch: ['lunch'],
  dinner: ['dinner'],
  snack: ['snack'],
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function fitsDiet(recipe, diet) {
  if (!diet || !diet.length) return true;
  return diet.every((d) => (recipe.diet || []).includes(d));
}

function poolForSlot(recipes, slot, diet) {
  const tagged = recipes.filter((r) => SLOT_TAGS[slot].some((t) => r.tags.includes(t)) && fitsDiet(r, diet));
  if (tagged.length) return tagged;
  const anyDiet = recipes.filter((r) => fitsDiet(r, diet));
  return anyDiet.length ? anyDiet : recipes;
}

/**
 * @param {{ recipes: import('../types').Recipe[], weekStart?: string,
 *           calorieTarget?: number, diet?: string[] }} options
 * @returns {import('../types').WeekPlan}
 */
export function buildWeekPlan({ recipes, weekStart, calorieTarget = 2000, diet = [] }) {
  const start = startOfWeekISO(weekStart || todayISO());
  const seed = hashString(start);
  const usage = new Map();

  const pick = (slot, dayIndex, slotShare) => {
    const pool = poolForSlot(recipes, slot, diet);
    if (!pool.length) return null;
    const target = calorieTarget * slotShare;
    const ranked = [...pool].sort((a, b) => {
      const da = Math.abs((a.calories || 0) - target);
      const db = Math.abs((b.calories || 0) - target);
      if (da !== db) return da - db;
      return a.id.localeCompare(b.id);
    });
    // Rotate through the ranked pool so a week is varied, and bias away from
    // recipes already used twice.
    const offset = (seed + dayIndex * 3 + SLOTS.indexOf(slot)) % ranked.length;
    for (let i = 0; i < ranked.length; i += 1) {
      const candidate = ranked[(offset + i) % ranked.length];
      if ((usage.get(candidate.id) || 0) < 2) {
        usage.set(candidate.id, (usage.get(candidate.id) || 0) + 1);
        return candidate.id;
      }
    }
    const fallback = ranked[offset % ranked.length];
    usage.set(fallback.id, (usage.get(fallback.id) || 0) + 1);
    return fallback.id;
  };

  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(start, i);
    days.push({
      date,
      recipeIds: {
        breakfast: pick('breakfast', i, SHARE.breakfast),
        lunch: pick('lunch', i, SHARE.lunch),
        dinner: pick('dinner', i, SHARE.dinner),
        snack: pick('snack', i, SHARE.snack),
      },
    });
  }

  return { weekStart: start, days };
}

export function planTotals(plan, recipesById) {
  const empty = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!plan) return { perDay: [], average: empty };

  const perDay = plan.days.map((day) => {
    const totals = { ...empty };
    for (const slot of SLOTS) {
      const id = day.recipeIds?.[slot];
      const recipe = id ? recipesById.get?.(id) : null;
      if (!recipe) continue;
      totals.calories += recipe.calories || 0;
      totals.protein += recipe.protein || 0;
      totals.carbs += recipe.carbs || 0;
      totals.fat += recipe.fat || 0;
    }
    return { date: day.date, ...totals };
  });

  const average = perDay.length
    ? {
        calories: Math.round(perDay.reduce((s, d) => s + d.calories, 0) / perDay.length),
        protein: Math.round(perDay.reduce((s, d) => s + d.protein, 0) / perDay.length),
        carbs: Math.round(perDay.reduce((s, d) => s + d.carbs, 0) / perDay.length),
        fat: Math.round(perDay.reduce((s, d) => s + d.fat, 0) / perDay.length),
      }
    : empty;

  return { perDay, average };
}

export function dayName(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}

export const PLAN_SLOTS = SLOTS;

/**
 * Aggregates the ingredients of a week plan into one shopping list.
 * Quantities are summed only when the unit matches; the same ingredient in
 * grams and in tablespoons stays on two lines rather than being silently added.
 *
 * @returns {{ key: string, name: string, quantity: number, unit: string,
 *             recipes: string[] }[]}
 */
export function buildShoppingList(plan, recipesById) {
  if (!plan) return [];

  const byKey = new Map();

  for (const day of plan.days) {
    for (const slot of SLOTS) {
      const recipeId = day.recipeIds?.[slot];
      const recipe = recipeId ? recipesById.get?.(recipeId) : null;
      if (!recipe) continue;

      for (const ingredient of recipe.ingredients || []) {
        const name = String(ingredient.name || '').trim();
        if (!name) continue;
        const unit = String(ingredient.unit || '').trim().toLowerCase();
        const key = `${name.toLowerCase()}|${unit}`;
        const entry = byKey.get(key);

        if (entry) {
          entry.quantity += Number(ingredient.quantity) || 0;
          if (!entry.recipes.includes(recipe.name)) entry.recipes.push(recipe.name);
        } else {
          byKey.set(key, {
            key,
            name,
            quantity: Number(ingredient.quantity) || 0,
            unit,
            recipes: [recipe.name],
          });
        }
      }
    }
  }

  return [...byKey.values()]
    .map((entry) => ({ ...entry, quantity: Math.round(entry.quantity * 10) / 10 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
