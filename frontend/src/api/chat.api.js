import api from './axios';

export const chatApi = {
  ask: (question) => api.post('/chat/ask', { question }),
};
