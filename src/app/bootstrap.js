// Boot sequence. The navigator must never render before the stored session is
// restored, or a signed-in user sees the sign-in screen for a frame and the
// auth gate decides they are signed out.

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import store from '../redux/store';
import { loadPersistedState, attachPersistence } from '../redux/persistence';
import { hydrateApp } from '../redux/actions';
import { authProvider } from '../services/auth';
import { setSession, bootstrapFailed } from '../redux/slices/authSlice';
import { resetApp } from '../redux/actions';
import { setUser } from '../redux/slices/userSlice';
import { rollOverDay } from '../redux/slices/nutritionSlice';
import { todayISO } from '../utils/date';

function syncProfile(dispatch, authUser) {
  const current = store.getState().user;
  if (!authUser) return;
  if (current.id === authUser.id) return; // keep the user's own edits
  if (current.id) {
    // A different account is signing in on this device. Drop the previous
    // account's diary before adopting the new profile.
    dispatch(resetApp());
  }
  dispatch(
    setUser({
      id: authUser.id,
      name: authUser.displayName,
      email: authUser.email,
    })
  );
}

export function useBootstrap() {
  const dispatch = useDispatch();
  const [status, setStatus] = useState({ ready: false, error: null });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      try {
        const persisted = await loadPersistedState();
        dispatch(hydrateApp(persisted));

        // Close yesterday before anything reads today's log.
        dispatch(rollOverDay(todayISO()));

        const user = await authProvider.init();
        if (cancelled) return;
        dispatch(setSession({ user }));
        syncProfile(dispatch, user);

        attachPersistence(store);
        authProvider.subscribe((nextUser) => {
          dispatch(setSession({ user: nextUser }));
          syncProfile(dispatch, nextUser);
        });

        setStatus({ ready: true, error: null });
      } catch (error) {
        dispatch(bootstrapFailed(error?.message || 'Could not load your data.'));
        setStatus({ ready: true, error: error?.message || 'Could not load your data.' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return status;
}

export default useBootstrap;
