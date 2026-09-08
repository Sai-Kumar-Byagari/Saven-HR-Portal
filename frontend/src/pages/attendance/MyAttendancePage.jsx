import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { formatIndianDate } from '../../utils/dateHelpers';
import { getFileUrl } from '../../utils/fileUrl';
import Spinner from '../../components/ui/Spinner';

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

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear]   = useState(today.getFullYear());

  const { data: todayAtt } = useQuery({
    queryKey: ['att', 'today'],
    queryFn: async () => { const r = await attendanceApi.getToday(); return r.data.data; },
    staleTime: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'my', page, month, year],
    queryFn: async () => {
      const r = await attendanceApi.getMy({ page, limit: 20, month, year });
      return r.data;
    },
  });

  const records = data?.data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Attendance</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your daily punch-in and punch-out records with photos</p>
      </div>

      {/* Today summary */}
      {todayAtt && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 flex-wrap ${todayAtt.clock_out ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <div className="flex-1 text-sm text-gray-700">
            <span className="font-semibold">Today: </span>
            Punched in at <strong className="text-green-700">{todayAtt.clock_in}</strong>
            {todayAtt.punch_in_photo && (
              <> · <PhotoLink path={todayAtt.punch_in_photo} label="In Photo" /></>
            )}
            {todayAtt.clock_out && (
              <>
                {' · '}Punched out at <strong className="text-red-500">{todayAtt.clock_out}</strong>
                {todayAtt.punch_out_photo && (
                  <> · <PhotoLink path={todayAtt.punch_out_photo} label="Out Photo" /></>
                )}
                {' · '}<span className="text-gray-500">{Math.floor(todayAtt.duration_mins/60)}h {todayAtt.duration_mins%60}m</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Month/Year filters */}
      <div className="flex gap-3">
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {Array.from({length:12},(_,i) => (
            <option key={i+1} value={i+1}>{new Date(2000,i,1).toLocaleString('default',{month:'long'})}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          No attendance records for this period
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date','Punch In','In Photo','Punch Out','Out Photo','Hours','Status'].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{formatIndianDate(row.date)}</td>
                  <td className="px-4 py-3">
                    {row.clock_in ? <span className="font-semibold text-green-700">{row.clock_in}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3"><PhotoLink path={row.punch_in_photo} label="View" /></td>
                  <td className="px-4 py-3">
                    {row.clock_out ? <span className="font-semibold text-red-500">{row.clock_out}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3"><PhotoLink path={row.punch_out_photo} label="View" /></td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.duration_mins ? `${Math.floor(row.duration_mins/60)}h ${row.duration_mins%60}m` : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={data?.pagination} onPageChange={setPage} />
    </div>
  );
}
