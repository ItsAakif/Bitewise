// Open Food Facts barcode lookup.
//
// Deliberately not routed through the app's axios client: that client carries the
// configured API base URL and refuses to run when no server is set, while this is
// a public third-party API that must work on a fresh install.
//
// ODbL: attribution is required. The app credits Open Food Facts wherever a
// product's data is shown.

import { zeros } from '../data/micros';

const BASE = 'https://world.openfoodfacts.org';
const USER_AGENT = 'BiteWise/1.3.0 (local-first nutrition diary)';

const FIELDS = [
  'product_name',
  'brands',
  'serving_size',
  'serving_quantity',
  'nutriments',
  'ingredients_analysis_tags',
  'allergens_tags',
  'categories_tags',
  'nutriscore_grade',
  'nova_group',
  'image_front_small_url',
].join(',');

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Nutriments come per 100 g and per serving; prefer serving when it exists. */
function pick(nutriments, key, suffix) {
  const serving = num(nutriments?.[`${key}_serving`]);
  if (serving != null) return { value: serving, basis: 'serving' };
  const hundred = num(nutriments?.[`${key}_100g`]);
  if (hundred != null) return { value: hundred, basis: '100g' };
  return { value: null, basis: suffix };
}

function gramsToMg(value) {
  return value == null ? null : Math.round(value * 1000 * 10) / 10;
}

/**
 * @param {object} product an Open Food Facts product object
 * @returns {import('../types').Food|null}
 */
export function mapProduct(product) {
  if (!product || !product.product_name) return null;

  const n = product.nutriments || {};
  const energy = pick(n, 'energy-kcal');
  const energyKj = num(n['energy-kj_serving']) ?? num(n['energy-kj_100g']);
  const calories =
    energy.value != null
      ? Math.round(energy.value)
      : energyKj != null
        ? Math.round(energyKj / 4.184)
        : null;

  if (calories == null) return null; // without energy there is nothing to log

  const servingText =
    energy.basis === 'serving'
      ? product.serving_size || '1 serving'
      : '100 g';

  const micros = zeros();
  const assign = (key, value) => {
    if (value != null) micros[key] = value;
  };

  assign('fiber', pick(n, 'fiber').value);
  assign('sugar', pick(n, 'sugars').value);
  assign('sodium', gramsToMg(pick(n, 'sodium').value));
  assign('calcium', gramsToMg(pick(n, 'calcium').value));
  assign('iron', gramsToMg(pick(n, 'iron').value));
  assign('potassium', gramsToMg(pick(n, 'potassium').value));
  assign('vitaminC', gramsToMg(pick(n, 'vitamin-c').value));

  const tags = product.ingredients_analysis_tags || [];
  const diet = [];
  if (tags.includes('en:vegan')) diet.push('vegan', 'vegetarian');
  else if (tags.includes('en:vegetarian')) diet.push('vegetarian');
  if (tags.includes('en:palm-oil-free')) diet.push('palm-oil-free');

  return {
    id: `off-${product.code || product._id || product.product_name}`,
    name: [product.brands, product.product_name].filter(Boolean).join(' — ') || product.product_name,
    serving: servingText,
    calories,
    protein: Math.round((pick(n, 'proteins').value ?? 0) * 10) / 10,
    carbs: Math.round((pick(n, 'carbohydrates').value ?? 0) * 10) / 10,
    fat: Math.round((pick(n, 'fat').value ?? 0) * 10) / 10,
    category: 'prepared',
    kind: 'ingredient',
    tags: ['packaged', 'open-food-facts'].concat(
      (product.categories_tags || []).slice(0, 2).map((t) => String(t).replace(/^en:/, ''))
    ),
    diet,
    micros,
    portions: undefined,
    source: {
      id: 'open-food-facts',
      name: 'Open Food Facts',
      url: `https://world.openfoodfacts.org/product/${product.code || ''}`,
      licence: 'ODbL',
    },
    nutriscore: product.nutriscore_grade || null,
    novaGroup: product.nova_group || null,
    allergens: (product.allergens_tags || []).map((t) => String(t).replace(/^en:/, '')),
  };
}

async function getJSON(path) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Open Food Facts responded ${response.status}.`);
  }
  return response.json();
}

/** @returns {Promise<import('../types').Food|null>} null when the barcode is unknown */
export async function lookupBarcode(code) {
  const clean = String(code || '').replace(/\D/g, '');
  if (clean.length < 8) return null;

  const payload = await getJSON(`/api/v2/product/${clean}.json?fields=${FIELDS}`);
  if (!payload || payload.status === 0 || !payload.product) return null;
  return mapProduct({ ...payload.product, code: clean });
}

/** @returns {Promise<import('../types').Food[]>} */
export async function searchProducts(query, { pageSize = 20 } = {}) {
  const term = String(query || '').trim();
  if (!term) return [];
  const payload = await getJSON(
    `/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=${pageSize}`
  );
  return (payload.products || []).map((product) => mapProduct(product)).filter(Boolean);
}

export const OPEN_FOOD_FACTS_CREDIT = 'Product data from Open Food Facts (ODbL).';
