// Import an external food dataset — INDB, IFCT, or any spreadsheet you own.
//
// The app cannot ship those datasets because their redistribution terms are not
// confirmed, but the moment you have a licensed copy the importer turns it into
// records the diary can use. Nothing here contains third-party data; it only
// reads what you paste or load.

import { FOOD_CATEGORIES } from '../data/foods';
import { MICRO_KEYS } from '../data/micros';
import { csvToObjects } from '../utils/csv';
import { uid } from '../utils/id';

const num = (value) => {
  const n = Number(String(value ?? '').replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

/** Column aliases, so an INDB or IFCT export does not need reshaping first. */
const ALIASES = {
  name: ['name', 'food_name', 'dish_name', 'food', 'description', 'item', 'recipe_name'],
  serving: ['serving', 'serving_size', 'portion', 'measure', 'household_measure'],
  calories: ['calories', 'energy_kcal', 'energy', 'kcal', 'energy_kcal_100g', 'calories_kcal'],
  protein: ['protein', 'protein_g', 'proteins', 'protein_g_100g'],
  carbs: ['carbs', 'carbohydrate', 'carbohydrates', 'carbs_g', 'carbohydrate_g'],
  fat: ['fat', 'fat_g', 'fats', 'total_fat_g'],
  category: ['category', 'food_group', 'group'],
  kind: ['kind', 'type'],
  diet: ['diet', 'diet_tags', 'tags'],
  fiber: ['fiber', 'fibre', 'dietary_fiber', 'fiber_g', 'fibre_g'],
  sugar: ['sugar', 'sugars', 'total_sugars_g', 'sugar_g'],
  sodium: ['sodium', 'sodium_mg', 'na_mg'],
  calcium: ['calcium', 'calcium_mg', 'ca_mg'],
  iron: ['iron', 'iron_mg', 'fe_mg'],
  zinc: ['zinc', 'zinc_mg', 'zn_mg'],
  magnesium: ['magnesium', 'magnesium_mg', 'mg_mg'],
  potassium: ['potassium', 'potassium_mg', 'k_mg'],
  vitaminC: ['vitaminc', 'vitamin_c', 'vitamin_c_mg', 'vitc_mg'],
  vitaminB12: ['vitaminb12', 'vitamin_b12', 'vitamin_b12_ug', 'b12_ug'],
  folate: ['folate', 'folate_ug', 'folic_acid_ug'],
  vitaminD: ['vitamind', 'vitamin_d', 'vitamin_d_ug'],
};

function pick(row, field) {
  const keys = ALIASES[field] || [field];
  for (const key of keys) {
    if (row[key] != null && row[key] !== '') return row[key];
    const lower = key.toLowerCase();
    for (const actual of Object.keys(row)) {
      if (actual.toLowerCase() === lower && row[actual] !== '') return row[actual];
    }
  }
  return undefined;
}

function toFood(row) {
  const name = String(pick(row, 'name') ?? '').trim();
  const calories = num(pick(row, 'calories'));
  if (!name) return { error: 'a row with no name' };
  if (calories == null || calories <= 0) return { error: `${name}: no usable calorie value` };

  const micros = {};
  for (const key of MICRO_KEYS) {
    const value = num(pick(row, key));
    if (value != null && value > 0) micros[key] = Math.round(value * 100) / 100;
  }

  const rawDiet = pick(row, 'diet');
  const diet = Array.isArray(rawDiet)
    ? rawDiet.map(String)
    : String(rawDiet || '')
        .split(/[;,|]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

  const category = String(pick(row, 'category') ?? '').toLowerCase().trim();
  const kind = String(pick(row, 'kind') ?? '').toLowerCase().trim();

  return {
    food: {
      id: uid('imp'),
      name,
      serving: String(pick(row, 'serving') ?? '100 g').trim() || '100 g',
      calories: Math.round(calories),
      protein: Math.round((num(pick(row, 'protein')) ?? 0) * 10) / 10,
      carbs: Math.round((num(pick(row, 'carbs')) ?? 0) * 10) / 10,
      fat: Math.round((num(pick(row, 'fat')) ?? 0) * 10) / 10,
      category: FOOD_CATEGORIES.includes(category) ? category : 'prepared',
      kind: kind === 'dish' || kind === 'ingredient' ? kind : 'ingredient',
      tags: ['imported'],
      diet: diet.length ? diet : [],
      micros: Object.keys(micros).length ? micros : undefined,
      portions: undefined,
      source: { id: 'dataset-import', name: 'Imported dataset', licence: 'supplied by the user' },
    },
  };
}

/**
 * Accepts a JSON array, a `{ foods: [...] }` object, or CSV with a header row.
 * @returns {{ foods: object[], errors: string[], total: number }}
 */
export function parseFoodDataset(text) {
  const input = String(text || '').trim();
  if (!input) return { foods: [], errors: ['Nothing to import.'], total: 0 };

  let rows;
  if (input.startsWith('[') || input.startsWith('{')) {
    let payload;
    try {
      payload = JSON.parse(input);
    } catch {
      return { foods: [], errors: ['That looks like JSON but does not parse.'], total: 0 };
    }
    rows = Array.isArray(payload) ? payload : payload.foods || payload.items || payload.recipes;
    if (!Array.isArray(rows)) {
      return { foods: [], errors: ['JSON must be an array, or an object with a foods array.'], total: 0 };
    }
  } else {
    rows = csvToObjects(input);
    if (!rows.length) {
      return { foods: [], errors: ['No rows found. Is the first line a header row?'], total: 0 };
    }
  }

  const foods = [];
  const errors = [];

  for (const row of rows) {
    const result = toFood(row);
    if (result.error) errors.push(result.error);
    else foods.push(result.food);
  }

  if (!foods.length) {
    errors.unshift('No usable rows. Each row needs a name and a calorie value.');
  }

  return { foods, errors: errors.slice(0, 20), total: rows.length };
}

/** A copyable template so the expected columns are obvious. */
export const DATASET_TEMPLATE = [
  'name,serving,calories,protein,carbs,fat,category,kind,iron,calcium,fiber',
  'Rajma,150 g,190,9,27,5,prepared,dish,3.2,48,6.4',
].join('\n');
