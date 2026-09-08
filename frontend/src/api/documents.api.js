import api from './axios';

export const documentsApi = {
  upload: (formData) =>
    api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: () => api.get('/documents'),
  getEmployee: (userId) => api.get(`/documents/employee/${userId}`),
  delete: (id) => api.delete(`/documents/${id}`),
};
