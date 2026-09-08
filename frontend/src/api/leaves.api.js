import api from './axios';

export const leavesApi = {
  apply: (data) => api.post('/leaves/apply', data),
  getMy: (params) => api.get('/leaves/my', { params }),
  getMyBalance: () => api.get('/leaves/my/balance'),
  getPending: (params) => api.get('/leaves/pending', { params }),
  action: (id, data) => api.put(`/leaves/${id}/action`, data),
  getManagement: () => api.get('/leaves/management'),
  cancel: (id) => api.delete(`/leaves/${id}`),
};
