import api from './axios';

export const settingsApi = {
  getAuditLogs: (params) => api.get('/settings/audit-logs', { params }),
  getSystemInfo: () => api.get('/settings/system-info'),
  globalSearch: (q) => api.get('/settings/search', { params: { q } }),
};
