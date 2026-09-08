import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  notificationPanelOpen: false,
  activeModal: null,
  modalData: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

  toggleNotificationPanel: () =>
    set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),
  closeNotificationPanel: () => set({ notificationPanelOpen: false }),

  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

export default useUiStore;
