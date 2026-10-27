// Body state only: weight, sleep, steps and the metrics they are measured
// against. Water and calories live in `nutrition` — this slice must not hold a
// second copy, which is what previously made two screens disagree.

import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_TARGETS } from '../../config/env';
import { hydrateApp, resetApp } from '../actions';
import { todayISO } from '../../utils/date';

const initialState = {
  weight: { current: null, history: [], goal: null },
  sleep: { lastNight: null, history: [], goal: DEFAULT_TARGETS.sleep },
  steps: { today: 0, history: [], goal: DEFAULT_TARGETS.steps },
  metrics: { height: null, age: null, sex: null, activityLevel: 'moderate' },
};

const upsertByDate = (list, date, entry) => {
  const next = list.filter((row) => row.date !== date);
  next.push({ date, ...entry });
  next.sort((a, b) => b.date.localeCompare(a.date));
  return next.slice(0, 400);
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    logWeight(state, action) {
      const { value, date = todayISO() } = action.payload;
      const weight = Number(value);
      if (!Number.isFinite(weight) || weight <= 0) return;
      state.weight.current = weight;
      state.weight.history = upsertByDate(state.weight.history, date, { value: weight });
    },
    setWeightGoal(state, action) {
      state.weight.goal = Number(action.payload) || null;
    },
    logSleep(state, action) {
      const { hours, date = todayISO() } = action.payload;
      const value = Number(hours);
      if (!Number.isFinite(value) || value < 0 || value > 24) return;
      state.sleep.lastNight = value;
      state.sleep.history = upsertByDate(state.sleep.history, date, { hours: value });
    },
    setSleepGoal(state, action) {
      state.sleep.goal = Number(action.payload) || 0;
    },
    logSteps(state, action) {
      const { value, date = todayISO() } = action.payload;
      const steps = Math.max(0, Math.round(Number(value) || 0));
      state.steps.today = steps;
      state.steps.history = upsertByDate(state.steps.history, date, { steps });
    },
    setStepGoal(state, action) {
      state.steps.goal = Number(action.payload) || 0;
    },
    updateMetrics(state, action) {
      state.metrics = { ...state.metrics, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.health;
        return persisted
          ? {
              ...initialState,
              ...persisted,
              weight: { ...initialState.weight, ...(persisted.weight || {}) },
              sleep: { ...initialState.sleep, ...(persisted.sleep || {}) },
              steps: { ...initialState.steps, ...(persisted.steps || {}) },
              metrics: { ...initialState.metrics, ...(persisted.metrics || {}) },
            }
          : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

export const {
  logWeight,
  setWeightGoal,
  logSleep,
  setSleepGoal,
  logSteps,
  setStepGoal,
  updateMetrics,
} = healthSlice.actions;

export const selectHealth = (state) => state.health;

export default healthSlice.reducer;
