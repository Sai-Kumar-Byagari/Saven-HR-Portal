import api from './axios';

export const employeeFormApi = {
  getMyForm:    ()           => api.get('/employee-forms/my'),
  saveForm:     (data)       => api.post('/employee-forms/my', data),
  submitForm:   (data)       => api.post('/employee-forms/my', { ...data, submit: true }),
  getAllForms:   (params)     => api.get('/employee-forms', { params }),
  getFormById:  (id)         => api.get(`/employee-forms/${id}`),
  reviewForm:   (id, data)   => api.put(`/employee-forms/${id}/review`, data),
};
