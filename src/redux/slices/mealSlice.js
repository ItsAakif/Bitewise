// Seven-day meal plan. Built locally from the recipe catalogue so the feature
// works offline; deterministic per week, so re-opening the screen does not
// reshuffle the food.

import { createSlice } from '@reduxjs/toolkit';
import { hydrateApp, resetApp } from '../actions';
import { buildWeekPlan } from '../../utils/mealPlan';
import { RECIPES } from '../../data/recipes';
import { todayISO } from '../../utils/date';

const initialState = {
  plan: null,
  // keys of shopping-list rows already picked up
  shoppingChecked: [],
  loading: false,
  error: null,
};

const mealSlice = createSlice({
  name: 'meal',
  initialState,
  reducers: {
    generatePlan(state, action) {
      const { weekStart, calorieTarget, diet } = action.payload || {};
      state.plan = buildWeekPlan({
        recipes: RECIPES,
        weekStart: weekStart || todayISO(),
        calorieTarget,
        diet,
      });
      state.error = null;
    },
    setPlannedMeal(state, action) {
      const { date, slot, recipeId } = action.payload;
      if (!state.plan) return;
      const day = state.plan.days.find((d) => d.date === date);
      if (!day) return;
      day.recipeIds[slot] = recipeId;
    },
    toggleShoppingItem(state, action) {
      const key = action.payload;
      state.shoppingChecked = state.shoppingChecked.includes(key)
        ? state.shoppingChecked.filter((entry) => entry !== key)
        : [...state.shoppingChecked, key];
    },
    clearShopping(state) {
      state.shoppingChecked = [];
    },
    clearPlan(state) {
      state.plan = null;
      state.shoppingChecked = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.meal;
        return persisted ? { ...initialState, ...persisted } : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

export const { generatePlan, setPlannedMeal, clearPlan, toggleShoppingItem, clearShopping, clearError } =
  mealSlice.actions;

export const selectPlan = (state) => state.meal.plan;
export const selectShoppingChecked = (state) => state.meal.shoppingChecked || [];

export default mealSlice.reducer;
