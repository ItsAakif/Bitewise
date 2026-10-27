// Natural-language food matching. Maps a typed sentence onto the bundled
// catalogue — it never invents a food that is not in it. Returns null when
// nothing matches, so the caller can say so.

import { scaleFood } from './nutrition';

const UNIT_GRAMS = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  cup: 240,
  cups: 240,
  tbsp: 15,
  tsp: 5,
};

const NUMBER_WORDS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  half: 0.5, '1/2': 0.5, quarter: 0.25, '1/4': 0.25, couple: 2,
};

const norm = (s) => String(s || '').toLowerCase().trim();

function readQuantity(segment) {
  const match = /^(\d+(?:[.,]\d+)?|\d+\/\d+|[a-z]+)\s*/.exec(segment);
  if (!match) return { quantity: 1, rest: segment };
  const raw = match[1];
  let quantity = null;
  if (/^\d+\/\d+$/.test(raw)) {
    const [a, b] = raw.split('/').map(Number);
    quantity = b ? a / b : 1;
  } else if (/^\d+([.,]\d+)?$/.test(raw)) {
    quantity = Number(raw.replace(',', '.'));
  } else if (NUMBER_WORDS[raw]) {
    quantity = NUMBER_WORDS[raw];
  }
  if (quantity === null) return { quantity: 1, rest: segment };
  return { quantity: quantity || 1, rest: segment.slice(raw.length) };
}

function readUnit(segment) {
  const match = /^([a-z]+)\s*/.exec(segment);
  if (!match) return { unit: null, rest: segment };
  const word = match[1];
  if (!UNIT_GRAMS[word]) return { unit: null, rest: segment };
  return { unit: word, rest: segment.slice(word.length) };
}

function bestMatch(text, foods) {
  const target = norm(text);
  if (!target) return null;

  let best = null;
  for (const food of foods) {
    const name = norm(food.name);
    const aliases = [name, ...name.split(/[,\s]+/).filter((w) => w.length > 3)];
    const generic = name.replace(/\s*,\s*(grilled|roasted|cooked|dry|raw|plain|firm|unsweetened|canned in water)$/, '');
    if (name !== generic) aliases.push(generic);

    for (const alias of aliases) {
      if (!alias) continue;
      if (target === alias) return { food, score: 100 };
      if (target.includes(alias)) {
        const score = 60 + alias.length;
        if (!best || score > best.score) best = { food, score };
      }
    }
  }
  return best;
}

/**
 * @param {string} text
 * @param {import('../types').Food[]} foods
 * @returns {import('../types').FoodItem[] | null}
 */
export function parseFoodText(text, foods = []) {
  const input = norm(text);
  if (!input) return null;

  const segments = input
    .split(/\s+and\s+|,|\+|&/)
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  for (const segment of segments) {
    const { quantity, rest } = readQuantity(segment);
    const { unit, rest: afterUnit } = readUnit(rest.trim());
    const phrase = afterUnit.trim();
    const match = bestMatch(phrase, foods) || bestMatch(segment, foods);
    if (!match) continue;

    // A metric unit overrides the catalogue serving only when the catalogue
    // serving itself is not already a metric measure; otherwise scale directly.
    const item = scaleFood(match.food, quantity, results.length);
    if (unit && UNIT_GRAMS[unit] && /\d+\s*(g|ml)\b/.test(match.food.serving || '')) {
      const servingSize = Number((/(\d+)\s*(?:g|ml)/.exec(match.food.serving) || [])[1]);
      if (servingSize > 0) {
        const factor = (UNIT_GRAMS[unit] * quantity) / servingSize;
        results.push(scaleFood(match.food, factor, results.length));
        continue;
      }
    }
    results.push(item);
  }

  return results.length ? results : null;
}

export default parseFoodText;
