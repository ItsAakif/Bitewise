// Firebase identity. Email and password only: signInWithPopup is a web API and
// can never work in React Native, so the provider buttons were removed rather
// than shipped broken.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  onAuthStateChanged,
  deleteUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../config/firebaseConfig';
import { DEFAULT_TARGETS } from '../../config/env';
import { signInWithGoogle as nativeGoogleSignIn, signOutGoogle } from './googleSignIn';

const NOT_CONFIGURED = 'Sign-in is not configured for this build.';

function ensure() {
  if (!isFirebaseConfigured || !auth || !db) throw new Error(NOT_CONFIGURED);
}

function toUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || (firebaseUser.email || '').split('@')[0],
    createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
    provider: 'firebase',
  };
}

function friendlyFirebaseError(error) {
  const code = error?.code || '';
  if (code.includes('user-not-found')) return new Error('No account found for that email.');
  if (code.includes('wrong-password') || code.includes('invalid-credential')) {
    return new Error('That password is not correct.');
  }
  if (code.includes('email-already-in-use')) return new Error('An account with that email already exists.');
  if (code.includes('weak-password')) return new Error('Password must be at least 8 characters.');
  if (code.includes('invalid-email')) return new Error('Enter a valid email address.');
  if (code.includes('too-many-requests')) return new Error('Too many attempts. Try again in a few minutes.');
  if (code.includes('network')) return new Error("Can't reach the sign-in service. Check your connection.");
  return new Error(error?.message || 'Sign-in failed.');
}

async function ensureProfile(user, displayName) {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: displayName || toUser(user).displayName,
      createdAt: new Date().toISOString(),
      targets: { ...DEFAULT_TARGETS },
    });
  }
}

export const firebaseAuth = {
  mode: 'firebase',

  async init() {
    ensure();
    return toUser(auth.currentUser);
  },

  subscribe(callback) {
    if (!isFirebaseConfigured || !auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, (user) => callback(toUser(user)));
  },

  async signIn({ email, password }) {
    ensure();
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return toUser(credential.user);
    } catch (error) {
      throw friendlyFirebaseError(error);
    }
  },

  async signUp({ email, password, displayName }) {
    ensure();
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateAuthProfile(credential.user, { displayName });
      await ensureProfile(credential.user, displayName);
      return toUser(credential.user);
    } catch (error) {
      throw friendlyFirebaseError(error);
    }
  },

  /**
   * Google sign-in: the native account picker returns an ID token, which Firebase
   * trades for a session. No popup and no redirect — those are web-only APIs and
   * are exactly what made the old buttons unusable in React Native.
   */
  async signInWithGoogle() {
    ensure();
    const { idToken, name } = await nativeGoogleSignIn();
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      await ensureProfile(result.user, name);
      return toUser(result.user);
    } catch (error) {
      throw friendlyFirebaseError(error);
    }
  },

  async signOut() {
    ensure();
    await signOutGoogle();
    await signOut(auth);
  },

  async resetPassword(email) {
    ensure();
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw friendlyFirebaseError(error);
    }
  },

  async updateProfile(userId, patch = {}) {
    ensure();
    const ref = doc(db, 'users', userId);
    const payload = {};
    if (patch.displayName) payload.displayName = patch.displayName;
    if (Object.keys(payload).length) await updateDoc(ref, payload);
    if (patch.displayName && auth.currentUser) {
      await updateAuthProfile(auth.currentUser, { displayName: patch.displayName });
    }
    return toUser(auth.currentUser);
  },

  async deleteAccount(userId) {
    ensure();
    await deleteDoc(doc(db, 'users', userId));
    if (auth.currentUser) await deleteUser(auth.currentUser);
  },
};

export default firebaseAuth;
