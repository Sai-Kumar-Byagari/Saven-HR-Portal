import api from './axios';

export const interviewsApi = {
  schedule:          (data)        => api.post('/interviews/schedule', data),
  getRounds:         (candidateId) => api.get(`/interviews/candidate/${candidateId}/rounds`),
  getRoundById:      (roundId)     => api.get(`/interviews/rounds/${roundId}`),
  submitFeedback:    (roundId, data)=> api.post(`/interviews/rounds/${roundId}/feedback`, data),
  uploadRecording:   (roundId, fd) => api.post(`/interviews/rounds/${roundId}/recording`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  makeDecision:      (roundId, data)=> api.put(`/interviews/rounds/${roundId}/decision`, data),
};
