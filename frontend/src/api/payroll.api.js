import api from './axios';

export const payrollApi = {
  // Upload payslip file (admin/payroll)
  upload:  (formData) => api.post('/payroll/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy:   (params)   => api.get('/payroll/my', { params }),
  getAll:  (params)   => api.get('/payroll/all', { params }),
  getById: (id)       => api.get(`/payroll/${id}`),
};
