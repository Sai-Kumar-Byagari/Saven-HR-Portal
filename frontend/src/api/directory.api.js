import api from './axios';

export const directoryApi = {
  getAll: (params) => api.get('/directory', { params }),
};
