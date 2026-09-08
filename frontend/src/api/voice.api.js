import api from './axios';

export const voiceApi = {
  submit: (data) => api.post('/voice', data),
  getInbox: (params) => api.get('/voice/inbox', { params }),
  updateStatus: (id, data) => api.put(`/voice/${id}/status`, data),
};
