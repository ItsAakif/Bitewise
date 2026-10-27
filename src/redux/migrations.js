// Migration from schema v1 to v2.
//
// v2 added micronutrients, household portions and the ingredient/dish split. Old
// stored state must keep working, so a missing micronutrient becomes an explicit
// zero object rather than undefined (which would crash every sum), and every
// function here is total: a corrupt value returns undefined and the slice falls
// back to its initial state.

import { zeros } from '../data/micros';
import { rdaFor } from '../data/indianRda';

export const SCHEMA_VERSION = 2;

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

function migrateItem(item) {
  if (!isObject(item)) return item;
  return {
    ...item,
    micros: isObject(item.micros) ? { ...zeros(), ...item.micros } : zeros(),
    microsKnown: item.microsKnown ?? false,
    portionLabel: item.portionLabel ?? '',
    grams: item.grams ?? null,
  };
}

function migrateDay(day) {
  if (!isObject(day)) return day;
  return {
    ...day,
    micros: isObject(day.micros) ? { ...zeros(), ...day.micros } : zeros(),
    meals: Array.isArray(day.meals)
      ? day.meals.map((meal) =>
          isObject(meal) && Array.isArray(meal.items)
            ? { ...meal, items: meal.items.map(migrateItem) }
            : meal
        )
      : [],
  };
}

/**
 * @param {string} slice reducer key
 * @param {unknown} value persisted value
 * @returns {unknown} migrated value, or undefined when it cannot be salvaged
 */
export function migrateSlice(slice, value) {
  if (value == null) return undefined;
  if (!isObject(value)) return undefined;

  try {
    switch (slice) {
      case 'nutrition': {
        const dailyLog = migrateDay(value.dailyLog || { date: '', meals: [], water: 0 });
        return {
          ...value,
          dailyLog,
          history: Array.isArray(value.history) ? value.history.map(migrateDay) : [],
          favorites: Array.isArray(value.favorites) ? value.favorites : [],
          customFoods: Array.isArray(value.customFoods) ? value.customFoods : [],
        };
      }

      case 'user': {
        const stats = isObject(value.stats) ? value.stats : {};
        const targets = isObject(value.targets) ? value.targets : {};
        const settings = isObject(value.settings) ? value.settings : {};
        return {
          ...value,
          stats,
          targets: {
            ...targets,
            micros: isObject(targets.micros)
              ? { ...rdaFor({ sex: stats.sex, age: stats.age }), ...targets.micros }
              : rdaFor({ sex: stats.sex, age: stats.age }),
          },
          settings: {
            ...settings,
            homeCards: Array.isArray(settings.homeCards) ? settings.homeCards : undefined,
          },
          preferences: {
            ...(isObject(value.preferences) ? value.preferences : {}),
            diet: Array.isArray(value.preferences?.diet) ? value.preferences.diet : [],
          },
        };
      }

      case 'fitness':
        return {
          ...value,
          workouts: Array.isArray(value.workouts)
            ? value.workouts.map((log) =>
                isObject(log)
                  ? { ...log, exercises: Array.isArray(log.exercises) ? log.exercises : [] }
                  : log
              )
            : [],
        };

      default:
        return value;
    }
  } catch {
    return undefined;
  }
}

export default migrateSlice;
