import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_TARGETS, REMINDER_DEFAULTS } from '../../config/env';
import { rdaFor } from '../../data/indianRda';
import { hydrateApp, resetApp } from '../actions';

const initialState = {
  id: null,
  name: '',
  email: '',
  preferences: {
    diet: [],
    restrictions: [],
    units: 'metric',
  },
  settings: {
    notifications: true,
    reminders: { ...REMINDER_DEFAULTS },
    language: 'en',
    // Bring-your-own model. Empty by default: nothing is called until the user
    // supplies a key, and no key is baked into the build.
    ai: {
      provider: 'openrouter',
      apiKey: '',
      baseUrl: '',
      visionModel: '',
      chatModel: '',
    },
    homeCards: ['score', 'calories', 'fasting', 'macros', 'water', 'history', 'meals'],
  },
  stats: {
    height: null,
    weight: null,
    age: null,
    sex: null,
    activityLevel: 'moderate',
  },
  targets: { ...DEFAULT_TARGETS, micros: rdaFor({}) },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      const user = action.payload || {};
      state.id = user.id ?? initialState.id;
      state.name = user.name ?? initialState.name;
      state.email = user.email ?? initialState.email;
      state.preferences = { ...initialState.preferences, ...(user.preferences || {}) };
      state.settings = {
        ...initialState.settings,
        ...(user.settings || {}),
        reminders: { ...REMINDER_DEFAULTS, ...((user.settings || {}).reminders || {}) },
      };
      state.stats = { ...initialState.stats, ...(user.stats || {}) };
      state.targets = {
        ...DEFAULT_TARGETS,
        micros: rdaFor({ sex: state.stats.sex, age: state.stats.age }),
        ...(user.targets || {}),
      };
    },
    updateProfileField(state, action) {
      const { field, value } = action.payload;
      if (field === 'name') state.name = value;
      else if (field === 'email') state.email = value;
    },
    updateStats(state, action) {
      const previous = { sex: state.stats.sex, age: state.stats.age };
      state.stats = { ...state.stats, ...action.payload };
      // Sex and age drive the reference intakes, so changing either re-derives
      // them. Every other stat leaves the user's edited targets alone.
      if (previous.sex !== state.stats.sex || previous.age !== state.stats.age) {
        state.targets.micros = {
          ...state.targets.micros,
          ...rdaFor({ sex: state.stats.sex, age: state.stats.age }),
        };
      }
    },
    updateTargets(state, action) {
      const { micros, ...rest } = action.payload || {};
      state.targets = { ...state.targets, ...rest };
      if (micros) state.targets.micros = { ...state.targets.micros, ...micros };
    },
    restoreRdaDefaults(state) {
      state.targets.micros = rdaFor({ sex: state.stats.sex, age: state.stats.age });
    },
    setHomeCards(state, action) {
      state.settings.homeCards = Array.isArray(action.payload) ? action.payload : state.settings.homeCards;
    },
    updateAiSettings(state, action) {
      state.settings.ai = { ...state.settings.ai, ...action.payload };
    },
    updateSettings(state, action) {
      state.settings = {
        ...state.settings,
        ...action.payload,
        reminders: { ...state.settings.reminders, ...(action.payload.reminders || {}) },
      };
    },
    updatePreferences(state, action) {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    toggleDiet(state, action) {
      const tag = action.payload;
      const current = state.preferences.diet || [];
      state.preferences.diet = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.user;
        return persisted ? { ...initialState, ...persisted } : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

export const {
  setUser,
  updateProfileField,
  updateStats,
  updateTargets,
  updateSettings,
  updatePreferences,
  toggleDiet,
  updateAiSettings,
  restoreRdaDefaults,
  setHomeCards,
} = userSlice.actions;

export const selectUser = (state) => state.user;
export const selectTargets = (state) => state.user.targets;
export const selectDiet = (state) => state.user.preferences.diet;

export default userSlice.reducer;
