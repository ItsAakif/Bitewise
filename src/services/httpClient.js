// One axios client for every HTTP call in the app, plus one error normaliser.
import axios from 'axios';
import { API_BASE_URL, isApiConfigured } from '../config/env';

export const NOT_CONFIGURED_MESSAGE =
  'The server address is not configured. Set EXPO_PUBLIC_API_BASE_URL or expo.extra.apiBaseUrl.';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fail fast (and honestly) when no base URL is configured.
http.interceptors.request.use((config) => {
  if (!isApiConfigured) {
    return Promise.reject(new Error(NOT_CONFIGURED_MESSAGE));
  }
  return config;
});

// Attach the Firebase auth token when a signed-in session exists.
// The import is guarded so the client keeps working if Firebase is absent.
http.interceptors.request.use(async (config) => {
  try {
    // eslint-disable-next-line global-require
    const firebaseConfig = require('../config/firebaseConfig');
    const user = firebaseConfig.auth && firebaseConfig.auth.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Auth is unavailable (not installed or not configured) - continue unauthenticated.
  }
  return config;
});

// Surface a single, user-readable string from every failure.
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(normalizeError(error)))
);

const SERVER_TOO_LONG = 'The server took too long to respond.';
const NETWORK_DOWN = "Can't reach the server. Check your connection.";
const SESSION_EXPIRED = 'Your session expired. Sign in again.';
const SERVER_FAILED = 'The server failed to handle that request.';
const REQUEST_FAILED = 'Something went wrong. Please try again.';

export function normalizeError(err) {
  if (!err) return REQUEST_FAILED;

  const isAxios = Boolean(err.isAxiosError);
  const status = err.response && err.response.status;
  const code = err.code || '';
  const message = typeof err.message === 'string' ? err.message : '';

  if (isAxios) {
    if (code === 'ECONNABORTED' || /timeout/i.test(message)) return SERVER_TOO_LONG;
    if (status === 401) return SESSION_EXPIRED;
    if (!err.response || code === 'ERR_NETWORK') return NETWORK_DOWN;
    if (status >= 500) return SERVER_FAILED;
    if (status >= 400) {
      const data = err.response.data || {};
      if (typeof data.error === 'string' && data.error) return data.error;
      if (typeof data.message === 'string' && data.message) return data.message;
      return REQUEST_FAILED;
    }
  }

  if (message) return message;
  return REQUEST_FAILED;
}
