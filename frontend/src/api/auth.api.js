import api from './axios';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  setFirstLoginPassword: (data) => api.post('/auth/first-login/set-password', data),
  refresh: () => api.post('/auth/refresh'),
};
