import api from './axios';

export const recruitmentApi = {
  createPosition:      (data)              => api.post('/recruitment/positions', data),
  getPositions:        (params)            => api.get('/recruitment/positions', { params }),
  getPosition:         (id)                => api.get(`/recruitment/positions/${id}`),
  sendForApproval:     (id, managerIds)    => api.post(`/recruitment/positions/${id}/send-for-approval`, { manager_ids: managerIds }),
  approveJD:           (id, data)          => api.put(`/recruitment/positions/${id}/approve-jd`, data),
  updateJD:            (id, content)       => api.put(`/recruitment/positions/${id}/update-jd`, { content }),
  retryJD:             (id)                => api.post(`/recruitment/positions/${id}/retry-jd`),
  closePosition:       (id)                => api.put(`/recruitment/positions/${id}/close`),
  getManagerApprovals: (params)            => api.get('/recruitment/jd-approvals/mine', { params }),
  uploadResumes:       (positionId, form)  => api.post(`/recruitment/positions/${positionId}/resumes`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getCandidates:       (positionId, params)=> api.get(`/recruitment/positions/${positionId}/candidates`, { params }),
  getCandidate:        (id)                => api.get(`/recruitment/candidates/${id}`),
};
