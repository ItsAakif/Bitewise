// Google sign-in is a native flow. On web the module does not exist, so this file
// exists to keep the web bundle resolvable and to give a clear answer.

export function googleReady() {
  return false;
}

export function googleUnavailableReason() {
  return 'Google sign-in needs the native app. Use email and password in the browser.';
}

export async function signInWithGoogle() {
  throw new Error(googleUnavailableReason());
}

export async function signOutGoogle() {}
