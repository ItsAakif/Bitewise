// Auth initialisation, native.
//
// Firebase 13 dropped the React Native persistence helper; 10.14 still ships it
// in the react-native build of @firebase/auth, which Metro selects through its
// "react-native" export condition. That is why the version is pinned to ^10.14.
//
// Do NOT hand-write a persistence object: initializeAuth maps each persistence
// through Firebase's internal registry and asserts that it is a real registered
// instance ("Expected a class definition"), so a plain object crashes at startup
// on every platform. Only the SDK's own factory produces a valid one.

import AsyncStorage from '@react-native-async-storage/async-storage';
// getReactNativePersistence is exported only by the react-native build of
// @firebase/auth, which Metro selects. ESLint resolves the browser build and
// cannot see it, hence the disable.
// eslint-disable-next-line import/named
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

export function createAuth(app) {
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
