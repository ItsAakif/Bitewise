// Bring-your-own-model.
//
// The user supplies an OpenRouter key (free models available), an OpenAI key, or
// any OpenAI-compatible endpoint. Nothing is proxied through us and there is no
// fallback key baked into the build.
//
// Design rule that keeps this honest: the model *identifies* food and picks from
// a catalogue it is shown. All arithmetic — calories, macros, portion maths —
// happens in our code from our own data. A small model asked "how many calories
// in this?" will answer confidently and wrongly; one asked "which of these 24
// rows is it, and roughly how many grams?" is doing a job it can actually do.

import * as FileSystem from 'expo-file-system';
import { resolvePortion } from '../utils/portions';
import { ALL_FOODS } from '../data';
import { formatCandidates, retrieveFoods, defaultCandidates } from '../utils/retrieval';
import { PROVIDERS, DEFAULT_SETTINGS, readConfig } from './aiConfig';

export { PROVIDERS, DEFAULT_SETTINGS, readConfig };

const headersFor = (config) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${config.apiKey}`,
  // OpenRouter asks for these so traffic is attributable.
  'HTTP-Referer': 'https://bitewise.app',
  'X-Title': 'BiteWise',
});

async function postChat(config, body) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: headersFor(config),
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.error?.message || parsed?.message || text;
    } catch {
      // keep raw text
    }
    if (response.status === 401) throw new Error('That API key was rejected (401).');
    if (response.status === 402) throw new Error('This model needs credit on your provider account.');
    if (response.status === 429) throw new Error('Rate limited by your provider. Try again shortly.');
    throw new Error(`Provider error ${response.status}: ${String(detail).slice(0, 160)}`);
  }

  const payload = JSON.parse(text);
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('The model returned no text.');
  return content;
}

/** Models the provider will serve for free, so the user is not guessing IDs. */
export async function listFreeModels(config) {
  const response = await fetch(`${config.baseUrl}/models`, { headers: headersFor(config) });
  if (!response.ok) throw new Error(`Could not list models (${response.status}).`);
  const payload = await response.json();
  const models = Array.isArray(payload?.data) ? payload.data : [];

  return models
    .map((model) => ({
      id: model.id,
      name: model.name || model.id,
      free:
        String(model?.pricing?.prompt ?? '1') === '0' &&
        String(model?.pricing?.completion ?? '1') === '0',
      vision: Array.isArray(model?.architecture?.input_modalities)
        ? model.architecture.input_modalities.includes('image')
        : false,
    }))
    .filter((model) => model.free);
}

async function toDataUrl(uri) {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return `data:image/jpeg;base64,${base64}`;
}

function parseJsonLoose(text) {
  const cleaned = String(text)
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
  }
  throw new Error('The model did not return usable JSON.');
}

const VISION_SYSTEM = `You identify food in a photo for a nutrition diary used in India.

Rules:
- Choose from the CATALOGUE when an entry matches. Use its id exactly.
- If nothing matches, still name the dish, and set catalogueId to null.
- Never output calories or macros. Another part of the system calculates those.
- Report the estimated weight in grams. If you cannot judge, use your best estimate and lower the confidence.
- If you cannot tell, say so with low confidence rather than guessing a plausible-looking dish.

Reply with JSON only, no prose and no code fences:
{"items":[{"name":"string","catalogueId":"string|null","grams":number,"confidence":0-1}],"note":"string"}`;

/**
 * Identify food in a photo, then price it from our catalogue.
 * @returns {Promise<{ items: object[], note: string, unmatched: object[] }>}
 */
export async function analyzeImage({ uri, config, candidates }) {
  if (!config?.ready) throw new Error('Add your AI key in Settings first.');

  const pool = candidates?.length ? candidates : defaultCandidates({ limit: 26 });
  const dataUrl = await toDataUrl(uri);

  const content = await postChat(config, {
    model: config.visionModel,
    temperature: 0.2,
    max_tokens: 700,
    messages: [
      { role: 'system', content: VISION_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: `CATALOGUE:\n${formatCandidates(pool)}\n\nWhat food is in this photo?` },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const parsed = parseJsonLoose(content);
  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const byId = new Map(ALL_FOODS.map((food) => [food.id, food]));

  const items = [];
  const unmatched = [];

  for (const raw of rawItems.slice(0, 12)) {
    const name = String(raw?.name || '').trim();
    if (!name) continue;

    const food = raw?.catalogueId ? byId.get(String(raw.catalogueId)) : null;
    const grams = Number(raw?.grams);
    const confidence = Math.max(0, Math.min(1, Number(raw?.confidence) || 0));

    if (!food) {
      // The model saw something we do not have. Say so; do not invent numbers.
      unmatched.push({ name, note: 'Not in the catalogue — pick a food to log it.' });
      continue;
    }

    // A model that declines to size the portion still gets a row; we fall back
    // to one serving rather than inventing a weight.
    const resolved = Number.isFinite(grams) && grams > 0
      ? resolvePortion({ food, grams })
      : resolvePortion({ food, count: 1 });
    const q = resolved.quantity;

    items.push({
      foodId: food.id,
      name: food.name,
      portionLabel: resolved.label,
      grams: resolved.grams,
      quantity: q,
      calories: Math.round(food.calories * q),
      protein: Math.round(food.protein * q * 10) / 10,
      carbs: Math.round(food.carbs * q * 10) / 10,
      fat: Math.round(food.fat * q * 10) / 10,
      confidence,
      // Numbers come from our row, not from the model.
      source: 'catalogue',
    });
  }

  return { items, unmatched, note: String(parsed?.note || '') };
}

const CHAT_SYSTEM = `You are a nutrition coach inside a local-first diary app used in India.

Ground every answer in the data below. If you are not given a number, do not assert one.
Prefer concrete quantities from the catalogue over general advice. Keep replies under 120 words.
If the user asks something medical, say plainly what you are not qualified to decide.

`;

/**
 * @returns {Promise<string>}
 */
export async function chat({ message, history, config, context }) {
  if (!config?.chatReady) throw new Error('Add your AI key in Settings first.');

  const candidates = retrieveFoods(message, { limit: 8 });
  const grounding = [
    context?.targets
      ? `Daily targets: ${context.targets.calories} kcal, ${context.targets.protein} g protein, ${context.targets.water} ml water.`
      : '',
    context?.today
      ? `Logged today: ${context.today.calories} kcal, ${context.today.protein} g protein, ${context.today.water} ml water.`
      : '',
    context?.recent?.length ? `Recent meals: ${context.recent.join('; ')}.` : '',
    candidates.length ? `Relevant catalogue rows:\n${formatCandidates(candidates)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const messages = [
    { role: 'system', content: `${CHAT_SYSTEM}${grounding}` },
    ...(history || []).slice(-6).map((entry) => ({
      role: entry.sender === 'user' ? 'user' : 'assistant',
      content: entry.text,
    })),
    { role: 'user', content: message },
  ];

  return postChat(config, {
    model: config.chatModel,
    temperature: 0.4,
    max_tokens: 600,
    messages,
  });
}
