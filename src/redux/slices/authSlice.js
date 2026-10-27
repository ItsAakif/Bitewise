import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authProvider } from '../../services/auth';
import { clearPersistedState } from '../persistence';
import { resetApp } from '../actions';

export const signInUser = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authProvider.signIn({ email, password });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signUpUser = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      return await authProvider.signUp({ email, password, displayName });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginWithGoogle = createAsyncThunk('auth/google', async (_, { rejectWithValue }) => {
  try {
    return await authProvider.signInWithGoogle();
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const signOutUser = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    // Data stays on disk: signing back in restores the same account. A
    // different account signing in is what resets it (see bootstrap).
    await authProvider.signOut();
    return true;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await authProvider.resetPassword(email);
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAccount = createAsyncThunk(
  'auth/updateAccount',
  async ({ userId, patch }, { rejectWithValue }) => {
    try {
      return await authProvider.updateProfile(userId, patch);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      await authProvider.deleteAccount(userId);
      await clearPersistedState();
      dispatch(resetApp());
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  mode: authProvider.mode,
  // unknown = bootstrap has not resolved yet; the navigator must not flash the
  // sign-in screen while the stored session is being restored.
  status: 'unknown',
  loading: false,
  error: null,
};

function fulfil(state, user) {
  state.loading = false;
  state.user = user;
  state.status = user ? 'signedIn' : 'signedOut';
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: {
      reducer(state, action) {
        const { user } = action.payload;
        state.user = user;
        state.status = user ? 'signedIn' : 'signedOut';
        state.error = null;
      },
      prepare(payload) {
        return { payload };
      },
    },
    clearError(state) {
      state.error = null;
    },
    bootstrapFailed(state, action) {
      state.status = 'signedOut';
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(signInUser.pending, pending)
      .addCase(signInUser.fulfilled, (state, action) => fulfil(state, action.payload))
      .addCase(signInUser.rejected, rejected)
      .addCase(signUpUser.pending, pending)
      .addCase(signUpUser.fulfilled, (state, action) => fulfil(state, action.payload))
      .addCase(signUpUser.rejected, rejected)
      .addCase(loginWithGoogle.pending, pending)
      .addCase(loginWithGoogle.fulfilled, (state, action) => fulfil(state, action.payload))
      .addCase(loginWithGoogle.rejected, rejected)
      .addCase(signOutUser.pending, pending)
      .addCase(signOutUser.fulfilled, (state) => fulfil(state, null))
      .addCase(signOutUser.rejected, rejected)
      .addCase(updateAccount.pending, pending)
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) state.user = action.payload;
      })
      .addCase(updateAccount.rejected, rejected)
      .addCase(deleteAccount.fulfilled, (state) => fulfil(state, null))
      .addCase(resetPassword.pending, pending)
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, rejected);
  },
});

export const { setSession, clearError, bootstrapFailed } = authSlice.actions;
export default authSlice.reducer;
