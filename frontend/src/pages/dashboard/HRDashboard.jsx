import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { recruitmentApi } from '../../api/recruitment.api';
import { leavesApi } from '../../api/leaves.api';
import { policiesApi } from '../../api/policies.api';
import { onboardingApi } from '../../api/onboarding.api';
import StatCard from '../../components/ui/StatCard';
import ClockInWidget from '../../components/shared/ClockInWidget';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';

const SI = (d) => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">{d}</svg>;

export default function HRDashboard() {
  const user = useAppSelector(selectUser);
  const { data: employees, isLoading: l1 } = useQuery({ queryKey: ['users','all'],       queryFn: async () => { const r = await usersApi.getAll({ limit:1 }); return r.data; } });
  const { data: positions, isLoading: l2 } = useQuery({ queryKey: ['positions','open'],  queryFn: async () => { const r = await recruitmentApi.getPositions({ status:'open',limit:1 }); return r.data; } });
  const { data: pending,   isLoading: l3 } = useQuery({ queryKey: ['leaves','pending'],  queryFn: async () => { const r = await leavesApi.getPending({ limit:1 }); return r.data; } });
  const { data: policies,  isLoading: l4 } = useQuery({ queryKey: ['policies'],          queryFn: async () => { const r = await policiesApi.getAll({ limit:1 }); return r.data; } });
  const { data: onboarding,isLoading: l5 } = useQuery({ queryKey: ['onboarding','sum'],  queryFn: async () => { const r = await onboardingApi.getSummary({ limit:50 }); return r.data; } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Good {getGreeting()}, {user?.firstName} 👋</h1>
        <p className="text-base text-gray-400 mt-1">Manage your people operations</p>
      </div>

      {/* Punch In/Out */}
      <ClockInWidget />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Employees"    value={employees?.pagination?.total}   loading={l1} color="blue"   icon={SI(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>)} />
        <StatCard title="Open Positions"     value={positions?.pagination?.total}   loading={l2} color="purple" icon={SI(<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>)} />
        <StatCard title="Pending Leaves"     value={pending?.pagination?.total}     loading={l3} color="yellow" icon={SI(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)} />
        <StatCard title="Policies"           value={policies?.pagination?.total}    loading={l4} color="green"  icon={SI(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>)} />
        <StatCard title="Pending Onboarding" value={onboarding?.data?.length ?? 0}  loading={l5} color="orange" icon={SI(<><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>)} />
      </div>

      {/* Pending onboarding table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-base font-semibold text-gray-800 mb-4">Pending Onboarding</p>
        {l5 ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded animate-pulse"/>)}</div>
        ) : (onboarding?.data||[]).length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">All employees have completed onboarding 🎉</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {(onboarding.data||[]).slice(0,8).map(emp=>(
              <div key={emp.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-gray-400">{emp.work_email}</p>
                </div>
                <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full font-medium">Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}
