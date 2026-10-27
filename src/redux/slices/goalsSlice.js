import { createSlice } from '@reduxjs/toolkit';
import { hydrateApp, resetApp } from '../actions';
import { uid } from '../../utils/id';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    addGoal: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare({ kind = 'custom', title, target, unit = '', start = null }) {
        return {
          payload: {
            id: uid('goal'),
            kind,
            title: String(title || '').trim(),
            target: Number(target) || 0,
            unit,
            start,
            createdAt: new Date().toISOString(),
            completedAt: null,
          },
        };
      },
    },
    updateGoal(state, action) {
      const { id, patch } = action.payload;
      const goal = state.items.find((g) => g.id === id);
      if (!goal) return;
      Object.assign(goal, {
        ...patch,
        target: patch.target !== undefined ? Number(patch.target) || 0 : goal.target,
      });
    },
    removeGoal(state, action) {
      state.items = state.items.filter((g) => g.id !== action.payload);
    },
    toggleComplete(state, action) {
      const goal = state.items.find((g) => g.id === action.payload);
      if (!goal) return;
      goal.completedAt = goal.completedAt ? null : new Date().toISOString();
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.goals;
        return persisted ? { ...initialState, ...persisted } : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

export const { addGoal, updateGoal, removeGoal, toggleComplete, clearError } = goalsSlice.actions;

export const selectGoals = (state) => state.goals.items;
export const selectActiveGoals = (state) => state.goals.items.filter((g) => !g.completedAt);

export default goalsSlice.reducer;
