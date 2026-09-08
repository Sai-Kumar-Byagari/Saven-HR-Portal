import api from './axios';

export const teamsApi = {
  // ── Teams ─────────────────────────────────────────────────────────────────
  create:           (data)      => api.post('/teams', data),
  getAll:           ()          => api.get('/teams'),
  getProgress:      ()          => api.get('/teams/progress'),
  getById:          (id)        => api.get(`/teams/${id}`),
  update:           (id, data)  => api.put(`/teams/${id}`, data),
  delete:           (id)        => api.delete(`/teams/${id}`),

  // ── Members ───────────────────────────────────────────────────────────────
  addMember:        (teamId, data)           => api.post(`/teams/${teamId}/members`, data),
  removeMember:     (teamId, userId)         => api.delete(`/teams/${teamId}/members/${userId}`),
  updateMember:     (teamId, userId, data)   => api.put(`/teams/${teamId}/members/${userId}`, data),

  // ── Projects ──────────────────────────────────────────────────────────────
  createProject:    (data)      => api.post('/teams/projects', data),
  getProject:       (id)        => api.get(`/teams/projects/${id}`),
  updateProject:    (id, data)  => api.put(`/teams/projects/${id}`, data),
  deleteProject:    (id)        => api.delete(`/teams/projects/${id}`),

  // ── Project Updates (daily employee updates) ──────────────────────────────
  postUpdate:       (projectId, data) => api.post(`/teams/projects/${projectId}/updates`, data),
  getUpdates:       (projectId)       => api.get(`/teams/projects/${projectId}/updates`),

  // ── Project Messages (manager ↔ team) ─────────────────────────────────────
  postMessage:      (projectId, data)             => api.post(`/teams/projects/${projectId}/messages`, data),
  replyMessage:     (projectId, msgId, data)      => api.post(`/teams/projects/${projectId}/messages/${msgId}/reply`, data),
  getMessages:      (projectId)                   => api.get(`/teams/projects/${projectId}/messages`),

  // ── Employee self-service ─────────────────────────────────────────────────
  getMyProjects:    ()          => api.get('/teams/my/projects'),
  getMyProject:     (id)        => api.get(`/teams/my/projects/${id}`),
};
