import api from './axios';

export const attendanceApi = {
  // punch-in/out now require a photo blob
  clockIn:  (photoBlob) => {
    const fd = new FormData();
    fd.append('photo', photoBlob, 'punch_in.jpg');
    return api.post('/attendance/clock-in', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  clockOut: (photoBlob) => {
    const fd = new FormData();
    fd.append('photo', photoBlob, 'punch_out.jpg');
    return api.post('/attendance/clock-out', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getToday:       ()       => api.get('/attendance/today'),
  getMy:          (params) => api.get('/attendance/my', { params }),
  getTeam:        (params) => api.get('/attendance/team', { params }),
  getAll:         (params) => api.get('/attendance/all', { params }),
  getWeeklySummary: ()     => api.get('/attendance/weekly-summary'),
  updateStatus: (id, status) => api.put(`/attendance/${id}/update-status`, { status }),
  getAbsentSummary: ()     => api.get('/attendance/absent-summary'),
  getReport: (params)      => api.get('/attendance/report', { params }),
  getUserReport: (userId)  => api.get(`/attendance/user-report/${userId}`),
};
