// Google sign-in on device, via the native Google Sign-In module.
//
// Split into .native.js and .web.js because the module has no web
// implementation: a plain require in a shared file would make the web bundle fail
// to resolve, even inside a try/catch. Metro picks the right file per platform.

import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../../config/env';

let googleModule = null;
try {
  // eslint-disable-next-line global-require
  googleModule = require('@react-native-google-signin/google-signin');
} catch {
  googleModule = null;
}

let configured = false;

export function googleReady() {
  return Boolean(googleModule?.GoogleSignin) && Boolean(GOOGLE_WEB_CLIENT_ID);
}

export function googleUnavailableReason() {
  if (!GOOGLE_WEB_CLIENT_ID) {
    return 'Google sign-in needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID from your Firebase project.';
  }
  if (!googleModule?.GoogleSignin) {
    return 'Google sign-in needs a development build; it is not available in Expo Go.';
  }
  return null;
}

function ensureConfigured() {
  if (configured) return;
  googleModule.GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  configured = true;
}

/**
 * Opens the native Google account picker.
 * @returns {Promise<{ idToken: string, email?: string, name?: string }>}
 */
export async function signInWithGoogle() {
  if (!googleReady()) throw new Error(googleUnavailableReason() || 'Google sign-in is unavailable.');

  const { GoogleSignin, isErrorWithCode, statusCodes } = googleModule;

  ensureConfigured();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  // v13+ returns { type: 'success'|'cancelled', data }, older versions return the
  // user object directly. Accept both so a version bump does not break sign-in.
  if (response?.type === 'cancelled') throw new Error('Sign-in was cancelled.');
  const payload = response?.data ?? response;
  const idToken = payload?.idToken ?? payload?.id_token;

  if (!idToken) {
    const code = isErrorWithCode && response?.error;
    throw new Error(
      code === statusCodes?.SIGN_IN_CANCELLED
        ? 'Sign-in was cancelled.'
        : 'Google did not return a sign-in token.'
    );
  }

  return {
    idToken,
    email: payload?.user?.email,
    name: payload?.user?.name,
  };
}

export async function signOutGoogle() {
  if (!googleModule?.GoogleSignin) return;
  try {
    await googleModule.GoogleSignin.signOut();
  } catch {
    // Nothing to sign out of.
  }
}
