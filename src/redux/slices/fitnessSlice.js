// Workout log. Local only — there is no server for this, so a session you log is
// a row on your device, not a sync that silently fails.

import { createSlice } from '@reduxjs/toolkit';
import { hydrateApp, resetApp } from '../actions';
import { todayISO } from '../../utils/date';
import { uid } from '../../utils/id';

const initialState = {
  workouts: [],
  loading: false,
  error: null,
};

const fitnessSlice = createSlice({
  name: 'fitness',
  initialState,
  reducers: {
    logWorkout: {
      reducer(state, action) {
        state.workouts.unshift(action.payload);
        if (state.workouts.length > 500) state.workouts.length = 500;
      },
      prepare({ workoutId, name, minutes, calories, exercises = [], date = todayISO() }) {
        return {
          payload: {
            id: uid('log'),
            workoutId,
            name,
            minutes: Math.max(0, Math.round(Number(minutes) || 0)),
            calories: Math.max(0, Math.round(Number(calories) || 0)),
            exercises: normaliseExercises(exercises),
            date,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
    updateSet(state, action) {
      const { logId, exerciseIndex, setIndex, patch } = action.payload;
      const log = state.workouts.find((w) => w.id === logId);
      const set = log?.exercises?.[exerciseIndex]?.sets?.[setIndex];
      if (!set) return;
      Object.assign(set, patch);
    },
    addSet(state, action) {
      const { logId, exerciseIndex } = action.payload;
      const exercise = state.workouts.find((w) => w.id === logId)?.exercises?.[exerciseIndex];
      if (!exercise) return;
      const last = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({ reps: last?.reps ?? 0, weightKg: last?.weightKg ?? 0, done: false });
    },
    removeSet(state, action) {
      const { logId, exerciseIndex, setIndex } = action.payload;
      const exercise = state.workouts.find((w) => w.id === logId)?.exercises?.[exerciseIndex];
      if (!exercise) return;
      exercise.sets.splice(setIndex, 1);
    },
    removeWorkout(state, action) {
      state.workouts = state.workouts.filter((w) => w.id !== action.payload);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.fitness;
        return persisted ? { ...initialState, ...persisted } : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

const normaliseExercises = (exercises) =>
  (Array.isArray(exercises) ? exercises : [])
    .filter((exercise) => exercise && exercise.name)
    .map((exercise) => ({
      name: String(exercise.name),
      sets: (Array.isArray(exercise.sets) ? exercise.sets : []).map((set) => ({
        reps: Math.max(0, Math.round(Number(set?.reps) || 0)),
        weightKg: Math.max(0, Number(set?.weightKg) || 0),
        done: Boolean(set?.done),
      })),
    }));

export const { logWorkout, updateSet, addSet, removeSet, removeWorkout, clearError } =
  fitnessSlice.actions;

/** The most recent logged sets for an exercise, so the screen can show "last time". */
export const lastPerformance = (state, exerciseName) => {
  const name = String(exerciseName || '').toLowerCase();
  for (const log of state.fitness.workouts) {
    const match = (log.exercises || []).find((e) => String(e.name).toLowerCase() === name);
    if (match) return { date: log.date, sets: match.sets };
  }
  return null;
};

export const selectWorkouts = (state) => state.fitness.workouts;

/** Total volume for a workout log: sum of reps × weight across completed sets. */
export const volumeOf = (log) =>
  (log?.exercises || []).reduce(
    (total, exercise) =>
      total +
      (exercise.sets || [])
        .filter((set) => set.done)
        .reduce((sum, set) => sum + set.reps * set.weightKg, 0),
    0
  );
export const selectWorkoutsThisWeek = (state) => {
  const cutoff = todayISO();
  return state.fitness.workouts.filter((w) => {
    const delta = (new Date(cutoff) - new Date(w.date)) / 86400000;
    return delta >= 0 && delta < 7;
  });
};

export default fitnessSlice.reducer;
