// Recipe customisation. Rewriting a recipe needs a language model, so this is
// remote-only and says so when no endpoint is configured. Saved results and the
// catalogue itself are local.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { http, normalizeError } from '../../services/httpClient';
import { isApiConfigured } from '../../config/env';
import { hydrateApp, resetApp } from '../actions';
import { uid } from '../../utils/id';

export const customizeRecipe = createAsyncThunk(
  'recipe/customize',
  async ({ recipeText, targetDiet }, { rejectWithValue }) => {
    if (!isApiConfigured) {
      return rejectWithValue(
        'Recipe rewriting needs a configured server. Set EXPO_PUBLIC_API_BASE_URL to enable it.'
      );
    }
    try {
      const response = await http.post('/customize-recipe', {
        recipe: recipeText,
        targetDiet,
      });
      const body = response.data?.customizedRecipe;
      if (typeof body !== 'string' || !body.trim()) {
        return rejectWithValue('The server returned an empty recipe.');
      }
      return body;
    } catch (error) {
      return rejectWithValue(normalizeError(error));
    }
  }
);

const initialState = {
  customized: [],
  imported: [],
  loading: false,
  error: null,
  available: isApiConfigured,
};

const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {
    saveCustomized: {
      reducer(state, action) {
        state.customized.unshift(action.payload);
      },
      prepare({ title, body, baseRecipeId = null }) {
        return {
          payload: {
            id: uid('recipe'),
            title: String(title || 'Customised recipe'),
            body,
            baseRecipeId,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
    removeCustomized(state, action) {
      state.customized = state.customized.filter((r) => r.id !== action.payload);
    },
    addImported(state, action) {
      const recipe = action.payload;
      if (!recipe?.id) return;
      state.imported = [recipe, ...state.imported.filter((r) => r.id !== recipe.id)].slice(0, 100);
    },
    removeImported(state, action) {
      state.imported = state.imported.filter((r) => r.id !== action.payload);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(customizeRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(customizeRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.customized.unshift({
          id: uid('recipe'),
          title: 'Customised recipe',
          body: action.payload,
          baseRecipeId: null,
          createdAt: new Date().toISOString(),
        });
      })
      .addCase(customizeRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.recipe;
        return persisted
          ? { ...initialState, ...persisted, loading: false, error: null, available: isApiConfigured }
          : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

export const { saveCustomized, removeCustomized, addImported, removeImported, clearError } =
  recipeSlice.actions;

export const selectCustomized = (state) => state.recipe.customized;
export const selectImported = (state) => state.recipe.imported || [];
export const selectRecipeAvailable = (state) => state.recipe.available;

export default recipeSlice.reducer;
