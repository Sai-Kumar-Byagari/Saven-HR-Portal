import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { teamsApi } from '../../api/teams.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

const COLORS = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#9333EA','#16A34A'];

const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700',
  planning:  'bg-blue-100 text-blue-700',
  on_hold:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
};

export default function TeamsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [form, setForm]             = useState({ name: '', description: '', color: '#2563EB' });

  const { data, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => { const r = await teamsApi.getAll(); return r.data.data; },
  });

  const createMutation = useMutation({
    mutationFn: () => teamsApi.create(form),
    onSuccess: () => {
      toast.success('Team created!');
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#2563EB' });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => teamsApi.delete(id),
    onSuccess: () => { toast.success('Team deleted.'); setDeleteId(null); queryClient.invalidateQueries({ queryKey: ['teams'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const teams = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Teams</h1>
          <p className="text-gray-400 text-sm mt-1">Create teams, add members, assign projects with responsibilities</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Create Team</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-lg font-medium text-gray-700">No teams yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a team, add employees, then create projects with clear responsibilities</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>Create First Team</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-1.5" style={{ background: team.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{team.name}</h3>
                    {team.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{team.description}</p>}
                  </div>
                  <button onClick={() => setDeleteId(team.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>👤 {(team.members || []).length} members</span>
                  <span>🏗 {(team.projects || []).length} projects</span>
                </div>

                {(team.members || []).length > 0 && (
                  <div className="flex -space-x-2 mt-3">
                    {(team.members || []).slice(0, 5).map(m => (
                      <Avatar key={m.id} name={`${m.employee?.first_name} ${m.employee?.last_name}`}
                        role={m.employee?.role} size="sm" className="ring-2 ring-white" />
                    ))}
                    {(team.members || []).length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500 font-medium">
                        +{(team.members || []).length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Recent project updates */}
                {(team.projects || []).some(p => p.updates?.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 mb-1.5">Recent activity</p>
                    {team.projects.filter(p => p.updates?.length > 0).slice(0, 2).map(p => (
                      <p key={p.id} className="text-xs text-gray-500 truncate">
                        <span className="font-medium text-gray-700">{p.name}:</span> {p.updates[0]?.message}
                      </p>
                    ))}
                  </div>
                )}

                <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => navigate(`/teams/${team.id}`)}>
                  Manage Team →
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create team modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Team" size="sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Team Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
              placeholder="e.g. Frontend Team, Backend Squad"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
              placeholder="What does this team work on?"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Team Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({...p, color: c}))}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} disabled={!form.name.trim()} onClick={() => createMutation.mutate()}>
              Create Team
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}
        title="Delete Team" message="This will permanently delete the team and all its projects."
        confirmLabel="Delete Team" />
    </div>
  );
}
