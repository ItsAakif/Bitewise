// Nutritionist chat. A language model is not something this app can run, so the
// feature is honest: when no endpoint is configured the composer is disabled and
// the screen says why. No canned replies pretending to be a coach.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { http, normalizeError } from '../../services/httpClient';
import { isApiConfigured } from '../../config/env';
import { chat as chatWithProvider, readConfig } from '../../services/aiProvider';
import { hydrateApp, resetApp } from '../actions';
import { uid } from '../../utils/id';

const formatContext = (messages = []) =>
  messages.slice(-6).map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, context = [] }, { rejectWithValue, getState }) => {
    const ai = readConfig(getState()?.user?.settings?.ai);
    if (ai.chatReady) {
      try {
        const state = getState();
        const reply = await chatWithProvider({
          message,
          history: context,
          config: ai,
          context: {
            targets: state.user?.targets,
            today: {
              calories: Math.round(state.nutrition?.dailyLog?.totals?.calories || 0),
              protein: Math.round(state.nutrition?.dailyLog?.totals?.protein || 0),
              water: Math.round(state.nutrition?.dailyLog?.water || 0),
            },
            recent: (state.nutrition?.dailyLog?.meals || [])
              .slice(-3)
              .map((meal) => meal.type + ' (' + Math.round(meal.total?.calories || 0) + ' kcal)'),
          },
        });
        return {
          userMessage: {
            id: uid('msg'),
            text: message,
            sender: 'user',
            timestamp: new Date().toISOString(),
          },
          coachMessage: {
            id: uid('msg'),
            text: reply,
            sender: 'coach',
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        return rejectWithValue(error.message || 'Your AI provider rejected the request.');
      }
    }

    if (!isApiConfigured) {
      return rejectWithValue(
        'Add a free AI key in Settings, or set EXPO_PUBLIC_API_BASE_URL to point at your own server.'
      );
    }
    try {
      const response = await http.post('/chat', {
        message,
        context: formatContext(context),
      });
      const reply = response.data?.reply;
      if (typeof reply !== 'string' || !reply.trim()) {
        return rejectWithValue('The coach returned an empty reply.');
      }
      return {
        userMessage: {
          id: uid('msg'),
          text: message,
          sender: 'user',
          timestamp: new Date().toISOString(),
        },
        coachMessage: {
          id: uid('msg'),
          text: reply,
          sender: 'coach',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return rejectWithValue(normalizeError(error));
    }
  }
);

const initialState = {
  messages: [],
  loading: false,
  error: null,
  available: isApiConfigured,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearChat(state) {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload.userMessage, action.payload.coachMessage);
        if (state.messages.length > 200) {
          state.messages = state.messages.slice(-200);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.chat;
        return persisted
          ? { ...initialState, ...persisted, loading: false, error: null, available: isApiConfigured }
          : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

export const { clearError, clearChat } = chatSlice.actions;

export const selectMessages = (state) => state.chat.messages;
export const selectChatAvailable = (state) => state.chat.available;

export default chatSlice.reducer;
