// One auth interface, two implementations. The selection happens once, at module
// load, from whether a Firebase project is configured.

import { isFirebaseConfigured } from '../../config/env';
import { googleReady, googleUnavailableReason } from './googleSignIn';
import { firebaseAuth } from './firebaseAuth';
import { localAuth } from './localAuth';

export const authProvider = isFirebaseConfigured ? firebaseAuth : localAuth;

export const isLocalMode = authProvider.mode === 'local';

/** Whether the Google button should be shown, and why not when it shouldn't. */
export const googleSignIn = {
  available: isFirebaseConfigured && googleReady(),
  reason: isFirebaseConfigured ? googleUnavailableReason() : null,
};

export default authProvider;
