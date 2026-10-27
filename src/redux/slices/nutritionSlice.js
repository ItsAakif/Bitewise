// Intake lives here and only here: calories, macros and water. `health` owns
// body state; it must never hold a second copy of any of these numbers.

import { createSlice } from '@reduxjs/toolkit';
import { hydrateApp, resetApp } from '../actions';
import { sumItems, sumMeals, requantify, sumItemMicros } from '../../utils/nutrition';
import { zeros } from '../../data/micros';
import { uid } from '../../utils/id';

export const emptyLog = (date) => ({
  date,
  meals: [],
  water: 0,
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  micros: zeros(),
});

const initialState = {
  dailyLog: emptyLog(''),
  // Completed days, newest first. Written by rollOverDay; read by every chart.
  history: [],
  favorites: [],
  customFoods: [],
  // { [foodId]: { calories, protein, carbs, fat, micros, serving } }
  foodOverrides: {},
  // Meal Memory: meals the user saved to log again
  mealTemplates: [],
};

const recalc = (state) => {
  state.dailyLog.totals = sumMeals(state.dailyLog.meals);
  state.dailyLog.micros = sumItemMicros(
    state.dailyLog.meals.flatMap((meal) => meal.items || [])
  );
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    rollOverDay(state, action) {
      const today = action.payload;
      if (!today || state.dailyLog.date === today) return;

      const hasItems = state.dailyLog.meals.some((m) => (m.items || []).length > 0);
      const previous = state.dailyLog;
      if (hasItems && previous.date && !state.history.some((d) => d.date === previous.date)) {
        // Keep the whole day, not just its totals: the diary can browse back
        // through it, and every chart derives from the same record.
        state.history.unshift({
          date: previous.date,
          meals: previous.meals,
          water: previous.water,
          totals: previous.totals,
          micros: previous.micros || zeros(),
        });
        state.history.sort((a, b) => b.date.localeCompare(a.date));
        if (state.history.length > 400) state.history.length = 400;
      }
      state.dailyLog = emptyLog(today);
    },
    addMeal(state, action) {
      const { type, items = [], time } = action.payload;
      if (!items.length) return;
      const meal = {
        id: uid('meal'),
        type,
        time: time || new Date().toISOString(),
        items,
        total: sumItems(items),
      };
      state.dailyLog.meals.push(meal);
      recalc(state);
    },
    removeMeal(state, action) {
      state.dailyLog.meals = state.dailyLog.meals.filter((m) => m.id !== action.payload);
      recalc(state);
    },
    addItemToMeal(state, action) {
      const { mealId, item } = action.payload;
      const meal = state.dailyLog.meals.find((m) => m.id === mealId);
      if (!meal) return;
      meal.items.push(item);
      meal.total = sumItems(meal.items);
      recalc(state);
    },
    updateItemQuantity(state, action) {
      const { mealId, itemId, quantity } = action.payload;
      const meal = state.dailyLog.meals.find((m) => m.id === mealId);
      if (!meal) return;
      meal.items = meal.items.map((item) =>
        item.id === itemId ? requantify(item, quantity) : item
      );
      meal.total = sumItems(meal.items);
      recalc(state);
    },
    removeItem(state, action) {
      const { mealId, itemId } = action.payload;
      const meal = state.dailyLog.meals.find((m) => m.id === mealId);
      if (!meal) return;
      meal.items = meal.items.filter((item) => item.id !== itemId);
      meal.total = sumItems(meal.items);
      if (!meal.items.length) {
        state.dailyLog.meals = state.dailyLog.meals.filter((m) => m.id !== mealId);
      }
      recalc(state);
    },
    setWater(state, action) {
      const ml = Number(action.payload);
      state.dailyLog.water = Number.isFinite(ml) && ml > 0 ? Math.round(ml) : 0;
    },
    addWater(state, action) {
      const delta = Number(action.payload) || 0;
      state.dailyLog.water = Math.max(0, state.dailyLog.water + Math.round(delta));
    },
    toggleFavorite(state, action) {
      const id = action.payload;
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id];
    },
    addMealTemplate(state, action) {
      const template = action.payload;
      if (!template?.items?.length) return;
      state.mealTemplates = [
        template,
        ...state.mealTemplates.filter((entry) => entry.id !== template.id),
      ].slice(0, 40);
    },
    removeMealTemplate(state, action) {
      state.mealTemplates = state.mealTemplates.filter((entry) => entry.id !== action.payload);
    },
    renameMealTemplate(state, action) {
      const { id, name } = action.payload || {};
      const template = state.mealTemplates.find((entry) => entry.id === id);
      if (template && String(name || '').trim()) template.name = String(name).trim();
    },
    markTemplateUsed(state, action) {
      const template = state.mealTemplates.find((entry) => entry.id === action.payload);
      if (template) template.uses = (template.uses || 0) + 1;
    },
    setFoodOverride(state, action) {
      const { foodId, patch } = action.payload || {};
      if (!foodId) return;
      state.foodOverrides[foodId] = { ...(state.foodOverrides[foodId] || {}), ...patch };
    },
    clearFoodOverride(state, action) {
      delete state.foodOverrides[action.payload];
    },
    addCustomFood(state, action) {
      state.customFoods.push(action.payload);
    },
    addCustomFoods(state, action) {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const existing = new Set(state.customFoods.map((food) => food.id));
      const seenNames = new Set(state.customFoods.map((food) => food.name.toLowerCase()));
      for (const food of incoming) {
        if (!food || existing.has(food.id)) continue;
        const key = String(food.name || '').toLowerCase();
        if (seenNames.has(key)) continue;
        state.customFoods.push(food);
        existing.add(food.id);
        seenNames.add(key);
      }
      // A cap keeps AsyncStorage writes bounded; 3,000 rows is far beyond what a
      // person logs from and still well inside a single storage value.
      if (state.customFoods.length > 3000) {
        state.customFoods = state.customFoods.slice(-3000);
      }
    },
    removeCustomFood(state, action) {
      state.customFoods = state.customFoods.filter((f) => f.id !== action.payload);
    },
    applyTotals(state) {
      recalc(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.nutrition;
        if (!persisted) return state;
        return {
          ...initialState,
          ...persisted,
          foodOverrides:
            persisted.foodOverrides && typeof persisted.foodOverrides === 'object'
              ? persisted.foodOverrides
              : {},
          mealTemplates: Array.isArray(persisted.mealTemplates) ? persisted.mealTemplates : [],
          dailyLog: {
            ...emptyLog(''),
            ...(persisted.dailyLog || {}),
            micros: { ...zeros(), ...((persisted.dailyLog || {}).micros || {}) },
          },
        };
      })
      .addCase(resetApp, () => initialState);
  },
});

export const {
  rollOverDay,
  addMeal,
  removeMeal,
  addItemToMeal,
  updateItemQuantity,
  removeItem,
  setWater,
  addWater,
  toggleFavorite,
  addCustomFood,
  addCustomFoods,
  setFoodOverride,
  clearFoodOverride,
  addMealTemplate,
  removeMealTemplate,
  renameMealTemplate,
  markTemplateUsed,
  removeCustomFood,
  applyTotals,
} = nutritionSlice.actions;

export const selectDailyLog = (state) => state.nutrition.dailyLog;
export const selectMicros = (state) => state.nutrition.dailyLog.micros || zeros();
export const selectHistory = (state) => state.nutrition.history;
export const selectTotals = (state) => state.nutrition.dailyLog.totals;
export const selectWater = (state) => state.nutrition.dailyLog.water;
export const selectMeals = (state) => state.nutrition.dailyLog.meals;
export const selectFavorites = (state) => state.nutrition.favorites;
export const selectCustomFoods = (state) => state.nutrition.customFoods;
export const selectFoodOverrides = (state) => state.nutrition.foodOverrides || {};
export const selectMealTemplates = (state) => state.nutrition.mealTemplates || [];

export default nutritionSlice.reducer;
