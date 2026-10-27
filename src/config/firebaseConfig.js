// Firebase singletons. When EXPO_PUBLIC_FIREBASE_* is absent the instances are
// null and the app still boots — the auth provider falls back to local accounts.
// Never throw at import: this module is on the entry path.

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG, isFirebaseConfigured } from './env';
import { createAuth } from '../services/auth/authPersistence';

export { isFirebaseConfigured };

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  app = initializeApp(FIREBASE_CONFIG);

  // Platform-split: AsyncStorage on device, IndexedDB on web. See authPersistence.
  auth = createAuth(app);

  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };
export default app;
