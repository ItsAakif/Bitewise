// Retrieval over the local catalogue.
//
// This is the "R" in the RAG the app does: before a model is asked anything, we
// pull the handful of catalogue entries that could plausibly be involved, and
// hand them to the model as a closed list. The model then has to choose from real
// rows rather than invent food, and every number it returns is checked against
// ours.
//
// No embeddings, no vector store — the catalogue is small enough that weighted
// token overlap beats the complexity, and it runs in a few milliseconds on device.

import { ALL_FOODS } from '../data';

const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'with', 'of', 'in', 'on', 'for', 'to', 'my', 'i',
  'had', 'have', 'ate', 'some', 'or', 'plus', 'bowl', 'plate', 'cup', 'glass',
  'katori', 'piece', 'pieces', 'serving', 'servings', 'g', 'gram', 'grams',
  'ml', 'tbsp', 'tsp', 'one', 'two', 'three', 'half',
]);

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

function scoreFood(food, tokens) {
  const haystack = `${food.name} ${(food.tags || []).join(' ')} ${food.category}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += token.length >= 5 ? 3 : 1;
  }
  // Whole-name containment is a much stronger signal than token overlap.
  const name = food.name.toLowerCase();
  for (const token of tokens) {
    if (name.includes(token)) score += 2;
  }
  return score;
}

/**
 * @param {string} query free text: a user's message, or a model's first guess
 * @param {{ limit?: number, foods?: object[] }} options
 * @returns {{ id: string, name: string, serving: string, calories: number,
 *             protein: number, carbs: number, fat: number, score: number }[]}
 */
export function retrieveFoods(query, { limit = 12, foods = ALL_FOODS } = {}) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  return foods
    .map((food) => ({ food, score: scoreFood(food, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .slice(0, limit)
    .map(({ food, score }) => ({
      id: food.id,
      name: food.name,
      serving: food.serving,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      score,
    }));
}

/** Compact list for a prompt: one line per food, id first so it can be cited. */
export function formatCandidates(candidates) {
  return candidates
    .map(
      (food) =>
        `- ${food.id} | ${food.name} | per ${food.serving}: ${food.calories} kcal, ${food.protein}P/${food.carbs}C/${food.fat}F`
    )
    .join('\n');
}

/** A broad starting set for a photo, where there is no text to retrieve from. */
export function defaultCandidates({ limit = 24 } = {}) {
  const dishes = ALL_FOODS.filter((food) => food.kind === 'dish');
  const staples = ALL_FOODS.filter((food) => food.kind !== 'dish');
  return [...dishes.slice(0, Math.ceil(limit * 0.7)), ...staples.slice(0, Math.floor(limit * 0.3))].map(
    (food) => ({
      id: food.id,
      name: food.name,
      serving: food.serving,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      score: 0,
    })
  );
}
