import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { formatIndianDate } from '../../utils/dateHelpers';
import { getFileUrl } from '../../utils/fileUrl';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { queryClient } from '../../config/queryClient';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { store } from '../../store/store';

function PhotoLink({ path, label }) {
  if (!path) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <a href={getFileUrl(path)} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors font-medium">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
      {label}
    </a>
  );
}

/* ── Confirmation Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({ isOpen, onClose, onConfirm, isPending, record }) {
  if (!isOpen || !record) return null;
  const empName = `${record.user?.first_name || ''} ${record.user?.last_name || ''}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mark as Present</h3>
              <p className="text-sm text-gray-500">Confirm attendance override</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Employee</span>
              <span className="font-medium text-gray-900">{empName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{formatIndianDate(record.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Status</span>
              <StatusBadge status={record.status} />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800">
              This will change attendance from <strong>Absent</strong> to <strong>Present</strong> and <strong>restore 1 day</strong> to the employee's leave balance.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm Mark Present
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceReportPage({ scope = 'team' }) {
  const [page, setPage]         = useState(1);
  const today                   = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate]     = useState(today);
  const user = useAppSelector(selectUser);
  const canUpdateStatus = user?.role === 'super_admin' || user?.role === 'manager';

  // Confirmation modal state
  const [confirmRecord, setConfirmRecord] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', scope, page, fromDate, toDate],
    queryFn: async () => {
      const params = { page, limit: 30, from_date: fromDate, to_date: toDate };
      const r = scope === 'all'
        ? await attendanceApi.getAll(params)
        : await attendanceApi.getTeam(params);
      return r.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => attendanceApi.updateStatus(id, status),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Attendance updated! Leave balance restored.');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setConfirmRecord(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
      setConfirmRecord(null);
    },
  });

  const handleMarkPresent = (record) => {
    setConfirmRecord(record);
  };

  const handleConfirm = () => {
    if (confirmRecord) {
      updateMutation.mutate({ id: confirmRecord.id, status: 'present' });
    }
  };

  // Report state
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportYear, setReportYear] = useState(currentYear);
  const [showReport, setShowReport] = useState(false);

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['attendance-report', reportMonth, reportYear],
    queryFn: async () => {
      const r = await attendanceApi.getReport({ month: reportMonth, year: reportYear });
      return r.data.data;
    },
    enabled: showReport,
  });

  const handleDownloadCsv = () => {
    const url = `${window.location.origin}/api/attendance/report?month=${reportMonth}&year=${reportYear}&format=csv`;
    const token = store.getState().auth.accessToken;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `attendance_report_${reportMonth}_${reportYear}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success('Report downloaded!');
      })
      .catch(() => toast.error('Failed to download report'));
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const records = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {scope === 'all' ? 'All Attendance' : 'Team Attendance'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {scope === 'all' ? 'View all employee attendance with punch-in/out photos' : 'View your team\'s attendance records'}
          </p>
        </div>
        <button
          onClick={() => setShowReport(!showReport)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {showReport ? 'Hide Report' : 'Monthly Report'}
        </button>
      </div>

      {/* Monthly Report Section */}
      {showReport && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-800">📊 Monthly Attendance Report</h2>
            <div className="flex items-center gap-3">
              <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={handleDownloadCsv}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </button>
            </div>
          </div>

          {reportLoading ? (
            <div className="flex justify-center py-8"><Spinner size="lg" /></div>
          ) : reportData?.report?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Employee','Emp ID','Present','Absent','On Leave','Absent Dates','On Leave Dates'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.report.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-3 text-gray-500">{row.emp_id || '—'}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold">{row.present_days}</span></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs font-bold">{row.absent_days}</span></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{row.on_leave_days}</span></td>
                      <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate" title={row.absent_dates}>{row.absent_dates || '—'}</td>
                      <td className="px-4 py-3 text-xs text-blue-500 max-w-[200px] truncate" title={row.on_leave_dates}>{row.on_leave_dates || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-6">No data for {monthNames[reportMonth - 1]} {reportYear}</p>
          )}
        </div>
      )}

      {/* Date filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-gray-500 font-medium">No attendance records found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting the date range</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Employee','Date','Punch In','In Photo','Punch Out','Out Photo','Hours','Status', ...(canUpdateStatus ? ['Action'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(row => (
                <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${row.status === 'absent' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${row.user?.first_name} ${row.user?.last_name}`} role={row.user?.role} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 whitespace-nowrap">{row.user?.first_name} {row.user?.last_name}</p>
                        <p className="text-xs text-gray-400">{row.user?.work_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatIndianDate(row.date)}</td>
                  <td className="px-4 py-3">
                    {row.clock_in ? (
                      <span className="font-semibold text-green-700">{row.clock_in}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <PhotoLink path={row.punch_in_photo} label="In Photo" />
                  </td>
                  <td className="px-4 py-3">
                    {row.clock_out ? (
                      <span className="font-semibold text-red-500">{row.clock_out}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <PhotoLink path={row.punch_out_photo} label="Out Photo" />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.duration_mins ? `${Math.floor(row.duration_mins/60)}h ${row.duration_mins%60}m` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  {canUpdateStatus && (
                    <td className="px-4 py-3">
                      {row.status === 'absent' ? (
                        <button
                          onClick={() => handleMarkPresent(row)}
                          disabled={updateMutation.isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Present
                        </button>
                      ) : row.status === 'present' ? (
                        <span className="text-xs text-gray-400">✓ Present</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmRecord}
        onClose={() => setConfirmRecord(null)}
        onConfirm={handleConfirm}
        isPending={updateMutation.isPending}
        record={confirmRecord}
      />
    </div>
  );
}
