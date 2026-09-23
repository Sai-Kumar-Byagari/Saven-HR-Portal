import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';

const STORAGE_KEY = 'saven-auth-v2';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationReducer,
  },
});

store.subscribe(() => {
  const { auth } = store.getState();
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          user: auth.user,
          accessToken: auth.accessToken,
          isAuthenticated: auth.isAuthenticated,
        },
      }),
    );
  } catch {
    // quota exceeded — non-critical
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
