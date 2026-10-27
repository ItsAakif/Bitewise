import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import nutritionReducer from './slices/nutritionSlice';
import healthReducer from './slices/healthSlice';
import fitnessReducer from './slices/fitnessSlice';
import mealReducer from './slices/mealSlice';
import recipeReducer from './slices/recipeSlice';
import chatReducer from './slices/chatSlice';
import socialReducer from './slices/socialSlice';
import goalsReducer from './slices/goalsSlice';

/**
 * Reducer keys. `scripts/verify-state.mjs` reads this object and fails the build
 * when a screen selects a key or a property that is not here, which is the class
 * of bug that stopped the app booting before.
 */
export const reducerMap = {
  auth: authReducer,
  user: userReducer,
  nutrition: nutritionReducer,
  health: healthReducer,
  fitness: fitnessReducer,
  meal: mealReducer,
  recipe: recipeReducer,
  chat: chatReducer,
  social: socialReducer,
  goals: goalsReducer,
};

export const store = configureStore({
  reducer: reducerMap,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Nothing in state should be non-serialisable. If this starts warning,
      // a Date or a function has leaked into a slice — fix the slice, do not
      // silence the check.
      serializableCheck: true,
    }),
});

export default store;
