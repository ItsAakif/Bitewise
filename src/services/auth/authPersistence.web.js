// Auth initialisation, web.
//
// The web build of @firebase/auth has no React Native persistence helper, so
// importing it here would fail at bundle time. getAuth() uses IndexedDB (falling
// back to localStorage), which persists the session across reloads.

import { getAuth } from 'firebase/auth';

export function createAuth(app) {
  return getAuth(app);
}
