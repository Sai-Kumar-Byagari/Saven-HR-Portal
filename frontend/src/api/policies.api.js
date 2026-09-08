import api from './axios';

export const policiesApi = {
  upload: (formData) =>
    api.post('/policies', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/policies', { params }),
  delete: (id) => api.delete(`/policies/${id}`),
};
