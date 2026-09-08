import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../../api/recruitment.api';
import { usersApi } from '../../api/users.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  draft:            'bg-gray-100 text-gray-600 border-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  open:             'bg-green-100 text-green-700 border-green-200',
  closed:           'bg-red-100 text-red-600 border-red-200',
};
const STATUS_LABEL = {
  draft:            'Draft',
  pending_approval: 'Sent for Approval',
  open:             'Approved — Open',
  closed:           'Closed',
};

export default function MyJDsPage() {
  const navigate = useNavigate();
  const [viewJD, setViewJD]       = useState(null);
  const [editingJD, setEditingJD] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [sendModal, setSendModal] = useState(null); // position to send
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch HR's own JDs (all statuses)
  const { data, isLoading } = useQuery({
    queryKey: ['my-jds'],
    queryFn: async () => {
      const r = await recruitmentApi.getPositions({ mine: 'true', limit: 100 });
      return r.data.data || [];
    },
    staleTime: 0,
  });

  // Fetch managers for the send modal
  const { data: managersData } = useQuery({
    queryKey: ['users', 'managers-all'],
    queryFn: async () => {
      const r = await usersApi.getAll({ role: 'manager', limit: 100 });
      return r.data.data || [];
    },
  });

  const updateJDMutation = useMutation({
    mutationFn: ({ id, content }) => recruitmentApi.updateJD(id, content),
    onSuccess: () => {
      toast.success('JD saved!');
      setViewJD(prev => prev ? { ...prev, jd: { ...prev.jd, content: editContent } } : null);
      setEditingJD(false);
      queryClient.invalidateQueries({ queryKey: ['my-jds'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const retryJDMutation = useMutation({
    mutationFn: (id) => recruitmentApi.retryJD(id),
    onSuccess: () => {
      toast.success('JD regenerated!');
      queryClient.invalidateQueries({ queryKey: ['my-jds'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'AI generation failed'),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, managerIds }) => recruitmentApi.sendForApproval(id, managerIds),
    onSuccess: (_, { managerIds }) => {
      toast.success(`JD sent to ${managerIds.length} manager(s) for approval!`);
      setSendModal(null); setSelectedManagers([]);
      queryClient.invalidateQueries({ queryKey: ['my-jds'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to send'),
  });

  const allPositions = data || [];
  const filtered = filterStatus === 'all' ? allPositions : allPositions.filter(p => p.status === filterStatus);

  function toggleManager(id) {
    setSelectedManagers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Job Descriptions</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Review AI-generated JDs, edit if needed, then send to managers for approval
          </p>
        </div>
        <Button onClick={() => navigate('/recruitment/create')}>+ Create New JD</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'draft', label: 'Draft' },
          { key: 'pending_approval', label: 'Sent' },
          { key: 'open', label: 'Approved' },
          { key: 'closed', label: 'Closed' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {f.label}
            {f.key === 'draft' && (allPositions.filter(p=>p.status==='draft').length > 0) && (
              <span className="ml-1 bg-orange-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {allPositions.filter(p=>p.status==='draft').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-3xl mb-3">📄</p>
          <p className="text-gray-500 font-medium">No JDs here yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a position and AI will generate the JD</p>
          <Button className="mt-4" onClick={() => navigate('/recruitment/create')}>Create New JD</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(pos => {
            const jd = pos.descriptions?.[0];
            const isDraft = pos.status === 'draft';
            const approvals = pos.approvals || [];

            return (
              <div key={pos.id} className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${isDraft ? 'border-orange-200 shadow-sm' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{pos.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[pos.status]}`}>
                        {STATUS_LABEL[pos.status]}
                      </span>
                      {jd?.ai_status === 'failed' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">⚠ AI Failed</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{pos.department}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs">
                      {pos.salary_lpa && <span className="text-gray-700 font-medium">💰 {pos.salary_lpa} LPA</span>}
                      {pos.experience_years && <span className="text-gray-600">🎯 {pos.experience_years} yrs</span>}
                      {pos.deadline && <span className="text-orange-500">⏰ {formatIndianDate(pos.deadline)}</span>}
                      <span className="text-gray-400">Created: {formatIndianDate(pos.created_at)}</span>
                    </div>

                    {/* Rejection comment */}
                    {pos.rejection_comment && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                        ❌ Rejected: {pos.rejection_comment}
                      </div>
                    )}

                    {/* Approval status per manager */}
                    {approvals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {approvals.map(a => (
                          <span key={a.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            a.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                            a.status === 'rejected' ? 'bg-red-100 text-red-600 border-red-200' :
                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }`}>
                            {a.manager?.first_name} {a.manager?.last_name}: {a.status}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Retry AI */}
                    {jd?.ai_status === 'failed' && (
                      <Button size="sm" variant="outline" loading={retryJDMutation.isPending}
                        onClick={() => retryJDMutation.mutate(pos.id)}>
                        🔄 Retry AI
                      </Button>
                    )}

                    {/* View/Edit JD */}
                    {jd && (
                      <Button size="sm" variant="outline" onClick={() => { setViewJD({ position: pos, jd }); setEditingJD(false); setEditContent(''); }}>
                        View JD
                      </Button>
                    )}

                    {/* Send for approval — only draft with valid JD */}
                    {isDraft && jd && jd.ai_status !== 'failed' && (
                      <Button size="sm" onClick={() => { setSendModal(pos); setSelectedManagers([]); }}>
                        Send for Approval →
                      </Button>
                    )}

                    {/* View candidates if open */}
                    {pos.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/recruitment/${pos.id}/candidates`)}>
                        Candidates
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── View / Edit JD Modal ───────────────────────────────────── */}
      <Modal isOpen={!!viewJD} onClose={() => { setViewJD(null); setEditingJD(false); setEditContent(''); }}
        title={viewJD?.position?.title || 'Job Description'} size="lg">
        {viewJD && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Department</p>
                <p className="font-medium text-gray-800 mt-0.5">{viewJD.position.department}</p>
              </div>
              {viewJD.position.salary_lpa && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Salary</p>
                  <p className="font-semibold text-green-700 mt-0.5">{viewJD.position.salary_lpa} LPA</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-700">Job Description</span>
              {['draft','pending_approval'].includes(viewJD.position.status) && !editingJD && (
                <button onClick={() => { setEditingJD(true); setEditContent(viewJD.jd.content); }}
                  className="text-xs text-blue-600 border border-blue-300 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium">
                  ✏️ Edit JD
                </button>
              )}
              {editingJD && (
                <button onClick={() => { setEditingJD(false); setEditContent(''); }}
                  className="text-xs text-gray-500 border border-gray-300 px-2 py-1 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              )}
            </div>

            {editingJD ? (
              <div className="space-y-2">
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={16} autoFocus
                  className="w-full border border-blue-300 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono" />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">{editContent.length} chars</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingJD(false); setEditContent(''); }}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Discard
                    </button>
                    <Button loading={updateJDMutation.isPending} disabled={!editContent.trim()}
                      onClick={() => updateJDMutation.mutate({ id: viewJD.position.id, content: editContent })}>
                      💾 Save JD
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewJD.jd.content}</p>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-gray-100">
              {viewJD.position.status === 'draft' && !editingJD && (
                <Button onClick={() => { setSendModal(viewJD.position); setSelectedManagers([]); setViewJD(null); }}>
                  Send for Approval →
                </Button>
              )}
              <Button variant="secondary" onClick={() => { setViewJD(null); setEditingJD(false); setEditContent(''); }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Send for Approval Modal ────────────────────────────────── */}
      <Modal isOpen={!!sendModal} onClose={() => { setSendModal(null); setSelectedManagers([]); }}
        title={`Send JD for Approval — ${sendModal?.title}`} size="sm">
        {sendModal && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              Select one or more managers to review this JD. Each selected manager will be notified and can approve or reject.
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Select Managers <span className="text-red-500">*</span></label>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {(managersData || []).length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">No managers found</p>
                ) : (
                  (managersData || []).map(m => (
                    <label key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedManagers.includes(m.id)}
                        onChange={() => toggleManager(m.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                        <p className="text-xs text-gray-400">{m.work_email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {selectedManagers.length > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                ✓ {selectedManagers.length} manager{selectedManagers.length > 1 ? 's' : ''} selected
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => { setSendModal(null); setSelectedManagers([]); }}>Cancel</Button>
              <Button
                loading={sendMutation.isPending}
                disabled={selectedManagers.length === 0}
                onClick={() => sendMutation.mutate({ id: sendModal.id, managerIds: selectedManagers })}
                className="flex-1"
              >
                Send to {selectedManagers.length || ''} Manager{selectedManagers.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
