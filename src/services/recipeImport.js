/* global AbortController, setTimeout, clearTimeout */
// Import a recipe from a URL by reading its schema.org JSON-LD — the same markup
// recipe sites publish for search engines. This is the established method and it
// needs no API key and no server.
//
// Honesty rule: an ingredient we could not match is reported, never dropped.
// If the page carries no nutrition, the macros are computed from the matched
// ingredients only and the recipe is marked as an estimate.

import { ALL_FOODS } from '../data';
import { scaleFood, sumItems } from '../utils/nutrition';
import { uid } from '../utils/id';

const FETCH_TIMEOUT_MS = 15000;

function parseDuration(value) {
  if (!value) return 0;
  const match = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(String(value).toUpperCase());
  if (!match) return 0;
  const [, days, hours, minutes] = match;
  return (Number(days) || 0) * 1440 + (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

function findRecipeNode(node, depth = 0) {
  if (!node || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object') return null;

  const type = node['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => String(t).toLowerCase() === 'recipe')) return node;

  for (const key of ['@graph', 'mainEntity', 'itemListElement', 'hasPart']) {
    if (node[key]) {
      const found = findRecipeNode(node[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function extractJsonLd(html) {
  const blocks = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = pattern.exec(html);
  while (match) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // A malformed block on the page must not fail the whole import.
    }
    match = pattern.exec(html);
  }
  return blocks;
}

function normaliseInstructions(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') {
    return raw
      .split(/\r?\n+/)
      .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter((line) => line.length > 2);
  }
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (typeof item === 'string') return [item.trim()];
      if (item?.['@type'] === 'HowToSection') return normaliseInstructions(item.itemListElement);
      if (item?.text) return [String(item.text).trim()];
      return [];
    });
  }
  return [];
}

function matchFood(line) {
  const haystack = String(line || '').toLowerCase();
  if (!haystack) return null;
  let best = null;
  for (const food of ALL_FOODS) {
    const name = food.name.toLowerCase();
    if (name.length < 4) continue;
    if (!haystack.includes(name)) continue;
    if (!best || name.length > best.name.length) best = food;
  }
  return best;
}

function parseNutritionValue(value) {
  if (value == null) return null;
  const match = /(\d+(?:\.\d+)?)/.exec(String(value));
  return match ? Number(match[1]) : null;
}

/**
 * @param {string} url
 * @returns {Promise<{ recipe: object, matched: object[], unmatched: string[], source: string }>}
 */
export async function importRecipeFromUrl(url) {
  const target = String(url || '').trim();
  if (!/^https?:\/\//i.test(target)) {
    throw new Error('Enter a full recipe URL starting with http:// or https://.');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS) : null;

  let html;
  try {
    const response = await fetch(target, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
      signal: controller?.signal,
    });
    if (!response.ok) throw new Error(`The page responded ${response.status}.`);
    html = await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('The page took too long to load.');
    throw new Error(error?.message || 'Could not load that page.');
  } finally {
    if (timer) clearTimeout(timer);
  }

  const blocks = extractJsonLd(html);
  let node = null;
  for (const block of blocks) {
    node = findRecipeNode(block);
    if (node) break;
  }

  if (!node) {
    throw new Error('No recipe was found on that page. It may not use standard recipe markup.');
  }

  const rawIngredients = Array.isArray(node.recipeIngredient) ? node.recipeIngredient : [];
  const matched = [];
  const unmatched = [];
  const ingredients = [];

  for (const line of rawIngredients) {
    const food = matchFood(line);
    if (food) {
      matched.push({ line: String(line), foodId: food.id, name: food.name });
      ingredients.push({
        name: food.name,
        quantity: 1,
        unit: 'serving',
        foodId: food.id,
        originalLine: String(line),
      });
    } else {
      unmatched.push(String(line));
      ingredients.push({ name: String(line), quantity: 1, unit: 'as written', foodId: null });
    }
  }

  const pageNutrition = node.nutrition || {};
  const pageCalories = parseNutritionValue(pageNutrition.calories);
  const servings = Math.max(1, Number(parseNutritionValue(node.recipeYield)) || 1);

  let macros = {
    calories: pageCalories || 0,
    protein: parseNutritionValue(pageNutrition.proteinContent) || 0,
    carbs: parseNutritionValue(pageNutrition.carbohydrateContent) || 0,
    fat: parseNutritionValue(pageNutrition.fatContent) || 0,
  };

  const estimated = pageCalories == null;
  if (estimated) {
    const items = matched
      .map((entry, index) => {
        const food = ALL_FOODS.find((f) => f.id === entry.foodId);
        return food ? scaleFood(food, 1, index) : null;
      })
      .filter(Boolean);
    const totals = sumItems(items);
    macros = {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
    };
  }

  const minutes = parseDuration(node.totalTime) || parseDuration(node.cookTime) + parseDuration(node.prepTime) || 30;

  const recipe = {
    id: uid('imported'),
    name: String(node.name || 'Imported recipe').slice(0, 120),
    description: String(node.description || '').slice(0, 400),
    minutes,
    servings,
    difficulty: 'easy',
    tags: ['imported'],
    diet: [],
    calories: Math.round(macros.calories / (estimated ? 1 : 1)),
    protein: Math.round(macros.protein),
    carbs: Math.round(macros.carbs),
    fat: Math.round(macros.fat),
    ingredients,
    steps: normaliseInstructions(node.recipeInstructions),
    estimated,
    sourceUrl: target,
  };

  return { recipe, matched, unmatched, source: target };
}

export default importRecipeFromUrl;
