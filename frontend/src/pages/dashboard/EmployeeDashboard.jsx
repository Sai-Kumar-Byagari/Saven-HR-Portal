import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leavesApi } from '../../api/leaves.api';
import { payrollApi } from '../../api/payroll.api';
import { holidaysApi } from '../../api/holidays.api';
import { teamsApi } from '../../api/teams.api';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ClockInWidget from '../../components/shared/ClockInWidget';
import { queryClient } from '../../config/queryClient';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import { useState } from 'react';

const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700 border-green-200',
  planning:  'bg-blue-100 text-blue-700 border-blue-200',
  on_hold:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
};

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [updateModal, setUpdateModal] = useState(null); // { project }
  const [updateForm, setUpdateForm] = useState({ message: '', progress_pct: '' });

  const { data: leaveBalance } = useQuery({
    queryKey: ['leaves', 'bal'],
    queryFn: async () => { const r = await leavesApi.getMyBalance(); return r.data.data; },
  });

  const { data: myProjectsData } = useQuery({
    queryKey: ['my-projects'], staleTime: 0,
    queryFn: async () => { const r = await teamsApi.getMyProjects(); return r.data.data; },
  });

  const { data: nextHoliday } = useQuery({
    queryKey: ['holidays', 'next'],
    queryFn: async () => {
      const r = await holidaysApi.getAll();
      return (r.data.data || []).filter(h => new Date(h.date) >= new Date())[0] || null;
    },
  });

  const { data: payslips } = useQuery({
    queryKey: ['pay', 'my'],
    queryFn: async () => { const r = await payrollApi.getMy({ limit: 1 }); return r.data; },
  });

  const postUpdateMutation = useMutation({
    mutationFn: () => teamsApi.postUpdate(updateModal.id, {
      message: updateForm.message,
      progress_pct: updateForm.progress_pct !== '' ? parseInt(updateForm.progress_pct) : undefined,
    }),
    onSuccess: () => {
      toast.success('Daily update posted! Manager notified.');
      setUpdateModal(null);
      setUpdateForm({ message: '', progress_pct: '' });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const remaining = leaveBalance ? leaveBalance.total_leaves - parseFloat(leaveBalance.used_leaves) : 0;
  const memberships = myProjectsData || [];
  const allProjects = memberships.flatMap(m => m.projects || []);
  const activeProjects = allProjects.filter(p => p.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Good {getGreeting()}, {user?.firstName} 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Punch In/Out — camera widget */}
      <ClockInWidget />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Leave Balance" value={`${remaining} days`} color="blue" subtitle={`${leaveBalance?.used_leaves||0} used`}
          icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
        <StatCard title="Active Projects" value={activeProjects.length} color="orange" subtitle={`${allProjects.length} total`}
          icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>} />
        <StatCard title="My Teams" value={memberships.length} color="purple" subtitle="teams assigned"
          icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>} />
        <StatCard title="Next Holiday" value={nextHoliday?.name||'None'} color="green" subtitle={nextHoliday ? formatIndianDate(nextHoliday.date) : ''}
          icon={<svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>} />
      </div>

      {/* Projects + Daily update */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* My Active Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-semibold text-gray-800">My Active Projects</p>
            <button onClick={() => navigate('/my-projects')} className="text-sm text-blue-600 hover:underline">View all →</button>
          </div>

          {activeProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🏗️</p>
              <p className="text-sm text-gray-400">No active projects. Your manager will assign you to projects.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 5).map(project => (
                <div key={project.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[project.status] || STATUS_COLORS.planning}`}>
                        {project.status?.replace('_',' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {project.tech_stack && <span className="text-[10px] text-gray-400">{project.tech_stack}</span>}
                      {project.end_date && <span className="text-[10px] text-orange-500 font-medium">⏰ {formatIndianDate(project.end_date)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setUpdateModal(project)}
                    className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors font-medium shrink-0 border border-blue-200">
                    + Update
                  </button>
                </div>
              ))}
              {activeProjects.length > 5 && (
                <button onClick={() => navigate('/my-projects')} className="w-full text-sm text-blue-600 hover:underline py-2 text-center">
                  +{activeProjects.length - 5} more projects
                </button>
              )}
            </div>
          )}
        </div>

        {/* My Responsibilities */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-semibold text-gray-800">My Responsibilities</p>
            <button onClick={() => navigate('/my-projects')} className="text-sm text-blue-600 hover:underline">Details →</button>
          </div>

          {memberships.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No responsibilities assigned yet</p>
          ) : (
            <div className="space-y-3">
              {memberships.map(m => m.membership?.responsibilities ? (
                <div key={m.team.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.team.color }} />
                    <p className="text-xs font-semibold text-blue-800">{m.team.name}</p>
                    {m.membership?.tech_role && <span className="text-[10px] text-blue-600">— {m.membership.tech_role}</span>}
                  </div>
                  <p className="text-xs text-blue-700 line-clamp-3 whitespace-pre-line">{m.membership.responsibilities}</p>
                  {m.membership?.member_deadline && (
                    <p className="text-[10px] text-orange-500 font-medium mt-1">⏰ {formatIndianDate(m.membership.member_deadline)}</p>
                  )}
                </div>
              ) : null)}
            </div>
          )}
        </div>
      </div>

      {/* Daily update reminder banner */}
      {activeProjects.length > 0 && (
        <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">📋 Daily Progress Update</p>
            <p className="text-blue-200 text-xs mt-0.5">Keep your manager informed — post your daily update for your active projects</p>
          </div>
          <button onClick={() => navigate('/my-projects')}
            className="shrink-0 text-xs font-semibold text-white border border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap">
            Post Update →
          </button>
        </div>
      )}

      {/* Daily Update Modal */}
      <Modal isOpen={!!updateModal} onClose={() => setUpdateModal(null)}
        title={`Daily Update — ${updateModal?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
            Your manager will be notified of this update.
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">What did you work on today? <span className="text-red-500">*</span></label>
            <textarea rows={4} value={updateForm.message}
              onChange={e => setUpdateForm(p => ({...p, message: e.target.value}))}
              placeholder="Describe your progress, what you completed, what's in progress, any blockers..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Your overall progress (%)</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" step="5"
                value={updateForm.progress_pct || 0}
                onChange={e => setUpdateForm(p => ({...p, progress_pct: e.target.value}))}
                className="flex-1" />
              <span className="text-sm font-bold text-blue-600 w-10 text-right">{updateForm.progress_pct || 0}%</span>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setUpdateModal(null)}>Cancel</Button>
            <Button loading={postUpdateMutation.isPending} disabled={!updateForm.message.trim()}
              onClick={() => postUpdateMutation.mutate()}>Post Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
