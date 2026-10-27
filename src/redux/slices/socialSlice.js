// Community. One local user, so the feed is your own journal plus personal
// challenges. No invented followers, no ranking of strangers, no participant
// counts — if this ever becomes multi-user it will be because Firebase is
// configured, not because the UI pretends.

import { createSlice } from '@reduxjs/toolkit';
import { hydrateApp, resetApp } from '../actions';
import { todayISO } from '../../utils/date';
import { uid } from '../../utils/id';

const initialState = {
  posts: [],
  challenges: [],
  loading: false,
  error: null,
};

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    addPost: {
      reducer(state, action) {
        state.posts.unshift(action.payload);
        if (state.posts.length > 200) state.posts.length = 200;
      },
      prepare({ body, authorName }) {
        const text = String(body || '').trim();
        return {
          payload: {
            id: uid('post'),
            body: text,
            authorName: authorName || 'You',
            createdAt: new Date().toISOString(),
            likedBy: [],
            comments: [],
          },
        };
      },
    },
    deletePost(state, action) {
      state.posts = state.posts.filter((p) => p.id !== action.payload);
    },
    toggleLike(state, action) {
      const { postId, userId } = action.payload;
      const post = state.posts.find((p) => p.id === postId);
      if (!post) return;
      const likedBy = post.likedBy || [];
      post.likedBy = likedBy.includes(userId)
        ? likedBy.filter((id) => id !== userId)
        : [...likedBy, userId];
    },
    addComment: {
      reducer(state, action) {
        const { postId, comment } = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (!post) return;
        post.comments.push(comment);
      },
      prepare({ postId, body, authorName }) {
        return {
          payload: {
            postId,
            comment: {
              id: uid('comment'),
              authorName: authorName || 'You',
              body: String(body || '').trim(),
              createdAt: new Date().toISOString(),
            },
          },
        };
      },
    },
    startChallenge(state, action) {
      const id = action.payload;
      if (state.challenges.some((c) => c.id === id)) return;
      state.challenges.push({ id, startedAt: todayISO(), days: [] });
    },
    stopChallenge(state, action) {
      state.challenges = state.challenges.filter((c) => c.id !== action.payload);
    },
    markChallengeDay(state, action) {
      const { id, date = todayISO() } = action.payload;
      const progress = state.challenges.find((c) => c.id === id);
      if (!progress) return;
      progress.days = progress.days.includes(date)
        ? progress.days.filter((d) => d !== date)
        : [...progress.days, date].sort();
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp, (state, action) => {
        const persisted = action.payload?.social;
        return persisted ? { ...initialState, ...persisted } : state;
      })
      .addCase(resetApp, () => initialState);
  },
});

export const {
  addPost,
  deletePost,
  toggleLike,
  addComment,
  startChallenge,
  stopChallenge,
  markChallengeDay,
  clearError,
} = socialSlice.actions;

export const selectPosts = (state) => state.social.posts;
export const selectChallengeProgress = (state) => state.social.challenges;

export default socialSlice.reducer;
