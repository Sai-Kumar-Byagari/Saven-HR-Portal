import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_ENDPOINTS } from './endpoints';
import { store } from '@/store/store';
import { logout, updateAccessToken } from '@/store/slices/authSlice';
import { logService } from '@/services/logService';
import type { ApiResponse } from '@/types/api.types';
import type { RefreshResponse } from '@/types/auth.types';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface AxiosInstanceDependencies {
  getAccessToken: () => string | null;
  onAccessTokenRefreshed: (accessToken: string) => void;
  onSessionExpired: () => void;
}

interface RefreshManagerDependencies {
  requestAccessToken: () => Promise<string>;
  onAccessTokenRefreshed: (accessToken: string) => void;
  onSessionExpired: () => void;
}

export function createRefreshManager(dependencies: RefreshManagerDependencies) {
  let refreshPromise: Promise<string> | null = null;

  return function getRefreshedAccessToken(): Promise<string> {
    if (!refreshPromise) {
      refreshPromise = dependencies
        .requestAccessToken()
        .then((accessToken) => {
          dependencies.onAccessTokenRefreshed(accessToken);
          return accessToken;
        })
        .catch((error: unknown) => {
          dependencies.onSessionExpired();
          return Promise.reject(error);
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  };
}

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REFRESH,
];

export function createAxiosInstance(
  dependencies: AxiosInstanceDependencies,
): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  client.interceptors.request.use((config) => {
    const token = dependencies.getAccessToken();
    if (token) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
    return config;
  });

  const refreshAccessToken = createRefreshManager({
    requestAccessToken: () =>
      client
        .post<ApiResponse<RefreshResponse>>(API_ENDPOINTS.AUTH.REFRESH)
        .then(({ data }) => data.data.accessToken),
    onAccessTokenRefreshed: dependencies.onAccessTokenRefreshed,
    onSessionExpired: dependencies.onSessionExpired,
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const original = error.config as RetryableRequestConfig | undefined;
      const requestUrl = original?.url ?? '';
      const isRefreshable401 =
        error.response?.status === 401 &&
        original !== undefined &&
        !original._retry &&
        !AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => requestUrl.includes(endpoint));

      if (isRefreshable401) {
        original._retry = true;
        try {
          const token = await refreshAccessToken();
          const headers = AxiosHeaders.from(original.headers);
          headers.set('Authorization', `Bearer ${token}`);
          original.headers = headers;
          return client(original);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      if (error.response?.status !== 401) {
        logService.error(
          `API ${original?.method?.toUpperCase() ?? 'REQUEST'} ${requestUrl || 'unknown'} failed`,
          {
            context: 'axios',
            metadata: {
              status: error.response?.status,
              message: error.response?.data?.message,
            },
          },
        );
      }

      return Promise.reject(error);
    },
  );

  return client;
}

const axiosInstance = createAxiosInstance({
  getAccessToken: () => store.getState().auth.accessToken,
  onAccessTokenRefreshed: (accessToken) => {
    store.dispatch(updateAccessToken(accessToken));
  },
  onSessionExpired: () => {
    store.dispatch(logout());
    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  },
});

export default axiosInstance;
