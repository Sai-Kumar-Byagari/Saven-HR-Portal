import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leavesApi } from '../../api/leaves.api';
import { attendanceApi } from '../../api/attendance.api';
import Spinner from '../../components/ui/Spinner';
import { ROLE_LABELS } from '../../config/roles';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

function UserReportModal({ userId, userName, onClose }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-report', userId],
    queryFn: async () => { const r = await attendanceApi.getUserReport(userId); return r.data.data; },
    retry: 2,
  });

  const handleDownloadCsv = () => {
    const url = `${window.location.origin}/api/attendance/user-report/${userId}?format=csv`;
    const token = useAuthStore.getState().accessToken;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${userName.replace(/\s+/g, '_')}_attendance.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success('CSV downloaded!');
      })
      .catch(() => toast.error('Download failed'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">📊 {userName} — Attendance Report</h2>
            {data && <p className="text-xs text-gray-400 mt-0.5">Financial Year: {data.financial_year}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[65vh]">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : data?.months?.length > 0 ? (
            <>
              {/* Totals */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{data.totals.present}</p>
                  <p className="text-xs text-green-600 mt-0.5">Present Days</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{data.totals.absent}</p>
                  <p className="text-xs text-red-600 mt-0.5">Absent Days</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{data.totals.on_leave}</p>
                  <p className="text-xs text-blue-600 mt-0.5">On Leave Days</p>
                </div>
              </div>

              {/* Month-by-month table */}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Month', 'Present', 'Absent', 'On Leave', 'Absent Dates', 'Leave Dates'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.months.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{m.month} {m.year}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold">{m.present}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs font-bold">{m.absent}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{m.on_leave}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-red-500 max-w-[180px]">
                        {m.absent_dates.length > 0 ? m.absent_dates.map(d => d.split('-').reverse().join('/')).join(', ') : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-blue-500 max-w-[180px]">
                        {m.on_leave_dates.length > 0 ? m.on_leave_dates.map(d => d.split('-').reverse().join('/')).join(', ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-500 font-medium">Failed to load report</p>
              <p className="text-xs text-gray-400 mt-1">{error?.response?.data?.message || error?.message || 'Unknown error'}</p>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">No attendance data found for this financial year</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeaveManagementPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', 'management'],
    queryFn: async () => { const r = await leavesApi.getManagement(); return r.data.data; },
  });

  const { data: absentData } = useQuery({
    queryKey: ['attendance', 'absent-summary'],
    queryFn: async () => { const r = await attendanceApi.getAbsentSummary(); return r.data.data; },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-500 text-sm mt-1">Annual leave overview for all employees</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Used = Applied leaves + Absent deductions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Absent Deductions = Auto-deducted for no punch-in</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Employee', 'Role', 'Total', 'Used (Total)', 'Absent Deductions', 'Used (This Month)', 'Remaining', 'Report'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data || []).map((row) => {
              const absentDays = absentData ? (absentData[row.user.id] || 0) : 0;
              const remaining = row.total - parseFloat(row.used_total);
              const fullName = `${row.user.first_name} ${row.user.last_name}`;

              return (
                <tr key={row.user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{fullName}</p>
                    <p className="text-xs text-gray-400">{row.user.work_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[row.user.role]}</td>
                  <td className="px-4 py-3 font-medium">{row.total}</td>
                  <td className="px-4 py-3">
                    <span className={parseFloat(row.used_total) > 12 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {row.used_total}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {absentDays > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {absentDays}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.used_this_month}</td>
                  <td className="px-4 py-3">
                    <span className={remaining < 3 ? 'text-orange-600 font-bold' : 'text-green-600 font-medium'}>
                      {remaining}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedUser({ id: row.user.id, name: fullName })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User Report Modal */}
      {selectedUser && (
        <UserReportModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
