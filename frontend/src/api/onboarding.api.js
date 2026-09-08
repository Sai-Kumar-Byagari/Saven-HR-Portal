import api from './axios';

export const onboardingApi = {
  getTasks: () => api.get('/onboarding/tasks'),
  getTasksForUser: (userId) => api.get(`/onboarding/tasks/${userId}`),
  updateTask: (taskId, data) => api.put(`/onboarding/tasks/${taskId}`, data),
  complete: () => api.post('/onboarding/complete'),
  getSummary: (params) => api.get('/onboarding/summary', { params }),
};
