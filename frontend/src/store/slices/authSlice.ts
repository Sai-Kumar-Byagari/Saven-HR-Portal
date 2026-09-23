import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'saven-auth-v2';

function loadPersistedState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state ?? parsed;
      if (state?.isAuthenticated && state?.user && state?.accessToken) {
        return {
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: true,
        };
      }
    }
  } catch {
    // corrupted storage — start fresh
  }
  return { user: null, accessToken: null, isAuthenticated: false };
}

const initialState: AuthState = loadPersistedState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuth, updateAccessToken, updateUser, logout } = authSlice.actions;

export function selectUser(state: { auth: AuthState }) {
  return state.auth.user;
}

export function selectUserRole(state: { auth: AuthState }) {
  return state.auth.user?.role ?? null;
}

export function selectIsAuthenticated(state: { auth: AuthState }) {
  return state.auth.isAuthenticated;
}

export function selectAccessToken(state: { auth: AuthState }) {
  return state.auth.accessToken;
}

export default authSlice.reducer;
