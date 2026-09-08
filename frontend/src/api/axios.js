import axios from 'axios';
import useAuthStore from '../store/authStore';

// Use relative /api so Vite proxy handles it in dev (avoids CORS)
// In production, set VITE_API_BASE_URL to the real server URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request interceptor — attach access token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 / token refresh ─────────────────────
let isRefreshing = false;
let refreshQueue = [];

function drainQueue(newToken) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        useAuthStore.getState().updateAccessToken(newToken);
        drainQueue(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
