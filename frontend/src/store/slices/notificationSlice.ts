import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '@/types/notification.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload;
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    markRead(state, action: PayloadAction<number>) {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.notifications.forEach((n) => {
        n.is_read = true;
      });
      state.unreadCount = 0;
    },
    removeNotification(state, action: PayloadAction<number>) {
      const idx = state.notifications.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        const wasUnread = !state.notifications[idx].is_read;
        state.notifications.splice(idx, 1);
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  markRead,
  markAllRead,
  removeNotification,
  addNotification,
} = notificationSlice.actions;

export function selectNotifications(state: { notifications: NotificationState }) {
  return state.notifications.notifications;
}

export function selectUnreadCount(state: { notifications: NotificationState }) {
  return state.notifications.unreadCount;
}

export default notificationSlice.reducer;
