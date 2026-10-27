// Device-local accounts. Passwords are salted and hashed with expo-crypto; the
// plaintext never touches storage. This is a usable account system for a
// single-device app, not a defence against someone holding the unlocked phone.

import * as Crypto from 'expo-crypto';
import { readJSON, writeJSON, remove, KEYS } from '../storage/persist';
import { uid } from '../../utils/id';

const MSG = {
  noAccount: 'No account found for that email.',
  badPassword: 'That password is not correct.',
  exists: 'An account with that email already exists.',
  short: 'Password must be at least 8 characters.',
  invalidEmail: 'Enter a valid email address.',
  noSession: 'You are not signed in.',
  noReset: 'Password reset needs email delivery, which local accounts do not have.',
};

const norm = (email) => String(email || '').trim().toLowerCase();

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm(email));
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hash(password, salt) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

async function loadAccounts() {
  const accounts = await readJSON(KEYS.accounts, {});
  return accounts && typeof accounts === 'object' ? accounts : {};
}

function toUser(account) {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName || account.email,
    createdAt: account.createdAt,
    provider: 'local',
  };
}

const listeners = new Set();
let currentUser = null;

function emit() {
  for (const listener of listeners) {
    try {
      listener(currentUser);
    } catch {
      // A screen unmounted mid-dispatch; ignore.
    }
  }
}

async function persistSession(user) {
  if (user) await writeJSON(KEYS.session, { userId: user.id, email: user.email });
  else await remove(KEYS.session);
}

export const localAuth = {
  mode: 'local',

  async init() {
    const session = await readJSON(KEYS.session, null);
    if (!session || !session.email) {
      currentUser = null;
      return null;
    }
    const accounts = await loadAccounts();
    const account = accounts[session.email];
    currentUser = account ? toUser(account) : null;
    if (!currentUser) await remove(KEYS.session);
    return currentUser;
  },

  subscribe(callback) {
    listeners.add(callback);
    callback(currentUser);
    return () => listeners.delete(callback);
  },

  async signIn({ email, password }) {
    if (!validEmail(email)) throw new Error(MSG.invalidEmail);
    const accounts = await loadAccounts();
    const key = norm(email);
    const account = accounts[key];
    if (!account) throw new Error(MSG.noAccount);
    const attempt = await hash(password, account.salt);
    if (attempt !== account.hash) throw new Error(MSG.badPassword);
    currentUser = toUser(account);
    await persistSession(currentUser);
    emit();
    return currentUser;
  },

  async signUp({ email, password, displayName }) {
    if (!validEmail(email)) throw new Error(MSG.invalidEmail);
    if (String(password || '').length < 8) throw new Error(MSG.short);
    const accounts = await loadAccounts();
    const key = norm(email);
    if (accounts[key]) throw new Error(MSG.exists);
    const salt = randomSalt();
    const account = {
      id: uid('local'),
      email: key,
      displayName: String(displayName || '').trim() || key.split('@')[0],
      salt,
      hash: await hash(password, salt),
      createdAt: new Date().toISOString(),
    };
    accounts[key] = account;
    await writeJSON(KEYS.accounts, accounts);
    currentUser = toUser(account);
    await persistSession(currentUser);
    emit();
    return currentUser;
  },

  async signOut() {
    currentUser = null;
    await remove(KEYS.session);
    emit();
  },

  async signInWithGoogle() {
    throw new Error(
      'Google sign-in needs a Firebase project. This build is using local accounts, which never leave the device.'
    );
  },

  async resetPassword() {
    throw new Error(MSG.noReset);
  },

  async updateProfile(userId, patch = {}) {
    const accounts = await loadAccounts();
    const entry = Object.entries(accounts).find(([, a]) => a.id === userId);
    if (!entry) throw new Error(MSG.noAccount);
    const [key, account] = entry;
    const next = {
      ...account,
      displayName: patch.displayName ?? account.displayName,
      email: patch.email ? norm(patch.email) : account.email,
    };
    delete accounts[key];
    accounts[next.email] = next;
    await writeJSON(KEYS.accounts, accounts);
    currentUser = toUser(next);
    await persistSession(currentUser);
    emit();
    return currentUser;
  },

  async deleteAccount(userId) {
    const accounts = await loadAccounts();
    for (const [key, account] of Object.entries(accounts)) {
      if (account.id === userId) delete accounts[key];
    }
    await writeJSON(KEYS.accounts, accounts);
    currentUser = null;
    await remove(KEYS.session);
    emit();
  },
};

export default localAuth;
