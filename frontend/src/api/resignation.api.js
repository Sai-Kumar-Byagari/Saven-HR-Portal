import api from './axios';

export const resignationApi = {
  submit: (data) => api.post('/resignation', data),
  getMy: () => api.get('/resignation/my'),
  getInbox: (params) => api.get('/resignation/inbox', { params }),
  updateStatus: (id, data) => api.put(`/resignation/${id}/status`, data),
  submitExitFeedback: (resignationId, data) =>
    api.post(`/resignation/${resignationId}/exit-feedback`, data),
};
