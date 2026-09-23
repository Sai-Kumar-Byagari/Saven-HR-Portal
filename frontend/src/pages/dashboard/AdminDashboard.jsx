import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { attendanceApi } from '../../api/attendance.api';
import { leavesApi } from '../../api/leaves.api';
import { recruitmentApi } from '../../api/recruitment.api';
import StatCard from '../../components/ui/StatCard';
import AttendanceBarChart from '../../components/charts/AttendanceBarChart';
import ClockInWidget from '../../components/shared/ClockInWidget';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { format } from 'date-fns';

const SI = (d) => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{d}</svg>;

export default function AdminDashboard() {
  const user = useAppSelector(selectUser);
  const today = new Date().toISOString().split('T')[0];

  const { data: employees, isLoading: l1 } = useQuery({ queryKey: ['users','all'],          queryFn: async () => { const r = await usersApi.getAll({ limit:1 }); return r.data; } });
  const { data: attendance, isLoading: l2 } = useQuery({ queryKey: ['attendance','today-all'],      queryFn: async () => { const r = await attendanceApi.getAll({ date:today,limit:500 }); return r.data; } });
  const { data: pending,   isLoading: l3 } = useQuery({ queryKey: ['leaves','pending'],       queryFn: async () => { const r = await leavesApi.getPending({ limit:1 }); return r.data; } });
  const { data: positions, isLoading: l4 } = useQuery({ queryKey: ['positions','open'],       queryFn: async () => { const r = await recruitmentApi.getPositions({ status:'open',limit:1 }); return r.data; } });
  const { data: weekly }                   = useQuery({ queryKey: ['att','weekly'],            queryFn: async () => { const r = await attendanceApi.getWeeklySummary(); return r.data.data; } });

  const att     = attendance?.data || [];
  const present = att.filter(a => a.status === 'present').length;
  const onLeave = att.filter(a => a.status === 'on_leave').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Good {getGreeting()}, {user?.firstName} 👋</h1>
        <p className="text-base text-gray-400 mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')} · Organisation overview</p>
      </div>

      {/* Punch In/Out */}
      <ClockInWidget />

      {/* Stat cards — full width 6 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Employees" value={employees?.pagination?.total} loading={l1} color="blue"
          icon={SI(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>)} />
        <StatCard title="Present Today"   value={present}                      loading={l2} color="green"
          icon={SI(<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>)} />
        <StatCard title="On Leave"        value={onLeave}                      loading={l2} color="yellow"
          icon={SI(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>)} />
        <StatCard title="Pending Leaves"  value={pending?.pagination?.total}   loading={l3} color="orange"
          icon={SI(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)} />
        <StatCard title="Open Positions"  value={positions?.pagination?.total} loading={l4} color="purple"
          icon={SI(<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>)} />
      </div>

      {/* Chart — full width */}
      <AttendanceBarChart data={weekly} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}
