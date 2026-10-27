// Single source of truth for environment-derived configuration.
// No hardcoded fallbacks: a missing value stays missing and surfaces as a
// boolean the UI can act on, so nothing silently calls localhost.

import { RECIPES } from '../data/recipes';

function readExtra() {
  try {
    // Metro bundles JSON; app.json carries `expo.extra`.
    const appJson = require('../../app.json');
    return (appJson && appJson.expo && appJson.expo.extra) || {};
  } catch {
    return {};
  }
}

const extra = readExtra();

// Resolution order: EXPO_PUBLIC_API_BASE_URL -> app.json expo.extra.apiBaseUrl.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl || undefined;

export const isApiConfigured = Boolean(API_BASE_URL);

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId
);

/** 'local' means everything is on the device. 'firebase' means a real project. */
export const AUTH_MODE = isFirebaseConfigured ? 'firebase' : 'local';

// Google sign-in needs an OAuth client ID from the same Firebase project. The web
// client ID is the one the ID token is issued to on both platforms.
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
export const isGoogleConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

export const NUTRITIONIX_CONFIG = {
  appId: process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID,
  apiKey: process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY,
};

/** Default daily targets, used until the user edits them in Settings. */
export const DEFAULT_TARGETS = {
  calories: 2000,
  protein: 80,
  carbs: 200,
  fat: 60,
  water: 2000,
  steps: 8000,
  sleep: 8,
};

export const REMINDER_DEFAULTS = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '19:00',
  water: '11:00',
};

/** Recipes are the only large catalogue the planner needs at boot. */
export const PLANNER_RECIPE_COUNT = RECIPES.length;

export const APP_VERSION = '1.1.0';
