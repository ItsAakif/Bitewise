// Cross-cutting actions. Every account-scoped slice listens for these two, so
// hydration and sign-out are one dispatch each instead of a list of per-slice
// actions that silently falls out of date when a slice is added.

import { createAction } from '@reduxjs/toolkit';

/** payload: { [sliceKey]: persistedState } */
export const hydrateApp = createAction('app/hydrate');

/** Back to initialState everywhere. */
export const resetApp = createAction('app/reset');
