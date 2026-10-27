// Nutrition HTTP API. Every server call the app makes goes through `http`.
import { http, normalizeError } from './httpClient';

const MACROS = ['calories', 'protein', 'carbs', 'fat'];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toItem(raw) {
  return {
    name: typeof raw?.name === 'string' ? raw.name : '',
    ...Object.fromEntries(MACROS.map((m) => [m, toNumber(raw?.[m])])),
    confidence: toNumber(raw?.confidence, 1),
  };
}

export const nutritionApi = {
  /**
   * Send a photo for food recognition.
   * @param {string} uri local image URI
   * @returns {Promise<{ items: Array<{ name, calories, protein, carbs, fat, confidence }> }>}
   */
  async analyzeImage(uri) {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'food.jpg',
      });

      const response = await http.post('/api/recognize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const rawItems = Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data?.predictions)
          ? response.data.predictions
          : Array.isArray(response.data)
            ? response.data
            : [];

      return { items: rawItems.map(toItem) };
    } catch (err) {
      throw new Error(normalizeError(err));
    }
  },

  /**
   * Natural-language food lookup, e.g. "1 large carrot".
   * @returns {Promise<Array<{ name, calories, protein, carbs, fat, confidence }>>}
   */
  async lookupNutrition(text) {
    try {
      const response = await http.get('/api/nutrition', { params: { text } });
      const rawItems = Array.isArray(response.data?.foods)
        ? response.data.foods
        : Array.isArray(response.data)
          ? response.data
          : [];
      return rawItems.map(toItem);
    } catch (err) {
      throw new Error(normalizeError(err));
    }
  },

  /**
   * Ask the server for meal suggestions for a payload built by the caller.
   */
  async suggestMeals(payload) {
    try {
      const response = await http.post('/api/suggestions', payload);
      return response.data;
    } catch (err) {
      throw new Error(normalizeError(err));
    }
  },
};

export default nutritionApi;
