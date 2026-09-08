import api from './axios';

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  updateBankDetails: (data) => api.put('/profile/bank-details', data),
  uploadPhoto: (formData) =>
    api.post('/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  requestPasswordOtp: (data) => api.post('/profile/request-password-otp', data),
  changePassword: (data) => api.put('/profile/change-password', data),
};
