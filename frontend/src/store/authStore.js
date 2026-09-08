import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),

      updateAccessToken: (accessToken) =>
        set({ accessToken }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : userData,
        })),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      getRole: () => get().user?.role ?? null,
    }),
    {
      name: 'saven-auth-v2', // bump version to clear old stale state
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
