// Catalogue search and filtering. Pure functions over the bundled data.

const norm = (s) => String(s || '').toLowerCase().trim();

function hasAllDiet(item, diet) {
  if (!diet || !diet.length) return true;
  const owned = item.diet || [];
  return diet.every((d) => owned.includes(d));
}

function scoreByName(name, query) {
  const n = norm(name);
  if (!n) return 0;
  if (n === query) return 100;
  if (n.startsWith(query)) return 80;
  if (n.includes(query)) return 60;
  const words = query.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const hit = words.filter((w) => n.includes(w)).length;
  return hit ? Math.round((hit / words.length) * 40) : 0;
}

export function filterByDiet(items = [], diet = []) {
  return items.filter((item) => hasAllDiet(item, diet));
}

export function searchFoods(query, { diet = [], category = null } = {}, foods = []) {
  const q = norm(query);
  const pool = foods.filter((f) => (category ? f.category === category : true));
  const filtered = filterByDiet(pool, diet);
  if (!q) return filtered;
  return filtered
    .map((f) => ({ f, score: scoreByName(f.name, q) + (f.tags.some((t) => norm(t).includes(q)) ? 25 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f);
}

export function searchRecipes(query, { diet = [], maxMinutes = 0, tag = null } = {}, recipes = []) {
  const q = norm(query);
  let pool = filterByDiet(recipes, diet);
  if (maxMinutes > 0) pool = pool.filter((r) => r.minutes <= maxMinutes);
  if (tag) pool = pool.filter((r) => r.tags.includes(tag));
  if (!q) return pool;
  return pool
    .map((r) => ({
      r,
      score:
        scoreByName(r.name, q) +
        (r.tags.some((t) => norm(t).includes(q)) ? 30 : 0) +
        (norm(r.description).includes(q) ? 15 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.r);
}

const RECIPE_ICONS = {
  breakfast: 'coffee-outline',
  lunch: 'bowl-mix-outline',
  dinner: 'pot-steam-outline',
  snack: 'food-apple-outline',
  soup: 'bowl-outline',
  salad: 'leaf',
  eggs: 'egg-outline',
  stirfry: 'shaker-outline',
  'batch-cook': 'fridge-outline',
  'no-cook': 'knife',
};

export function recipeIcon(recipe) {
  if (!recipe) return 'silverware-fork-knife';
  for (const tag of recipe.tags || []) {
    const key = norm(tag).replace(/\s+/g, '-');
    if (RECIPE_ICONS[key]) return RECIPE_ICONS[key];
  }
  return 'silverware-fork-knife';
}

const WORKOUT_ICONS = {
  strength: 'dumbbell',
  cardio: 'run',
  hiit: 'lightning-bolt-outline',
  mobility: 'yoga',
};

export function workoutIcon(workout) {
  return WORKOUT_ICONS[workout?.type] || 'dumbbell';
}

const FOOD_ICONS = {
  fruit: 'food-apple-outline',
  vegetable: 'carrot',
  grain: 'barley',
  protein: 'food-steak',
  dairy: 'cup-outline',
  fat: 'nut',
  drink: 'cup-water',
  snack: 'cookie-outline',
  prepared: 'silverware-fork-knife',
};

export function foodIcon(food) {
  return FOOD_ICONS[food?.category] || 'silverware-fork-knife';
}

export function byId(items = []) {
  const map = new Map();
  for (const item of items) map.set(item.id, item);
  return map;
}
