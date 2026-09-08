import api from './axios';

export const usersApi = {
  create: (data) => api.post('/users', data),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  permanentDelete: (id) => api.delete(`/users/${id}/permanent`),
  getTeam: (params) => api.get('/users/team', { params }),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
};
