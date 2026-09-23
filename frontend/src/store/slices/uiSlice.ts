import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarCollapsed: boolean;
  notificationPanelOpen: boolean;
  activeModal: string | null;
  modalData: unknown;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  notificationPanelOpen: false,
  activeModal: null,
  modalData: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleNotificationPanel(state) {
      state.notificationPanelOpen = !state.notificationPanelOpen;
    },
    closeNotificationPanel(state) {
      state.notificationPanelOpen = false;
    },
    openModal(state, action: PayloadAction<{ name: string; data?: unknown }>) {
      state.activeModal = action.payload.name;
      state.modalData = action.payload.data ?? null;
    },
    closeModal(state) {
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleNotificationPanel,
  closeNotificationPanel,
  openModal,
  closeModal,
} = uiSlice.actions;

export function selectSidebarCollapsed(state: { ui: UiState }) {
  return state.ui.sidebarCollapsed;
}

export function selectNotificationPanelOpen(state: { ui: UiState }) {
  return state.ui.notificationPanelOpen;
}

export function selectActiveModal(state: { ui: UiState }) {
  return state.ui.activeModal;
}

export function selectModalData(state: { ui: UiState }) {
  return state.ui.modalData;
}

export default uiSlice.reducer;
