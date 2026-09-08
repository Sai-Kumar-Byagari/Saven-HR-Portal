import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../../api/recruitment.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-600 border-red-200',
};

export default function JDApprovalsPage() {
  const navigate = useNavigate();
  const [viewJD, setViewJD]           = useState(null);
  const [editingJD, setEditingJD]     = useState(false);
  const [editContent, setEditContent] = useState('');
  const [decideModal, setDecideModal] = useState(null);
  const [minScore, setMinScore]       = useState('70');
  const [comment, setComment]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch JDs assigned to this manager
  const { data, isLoading } = useQuery({
    queryKey: ['manager-jd-approvals'],
    queryFn: async () => {
      const r = await recruitmentApi.getManagerApprovals();
      return r.data.data || [];
    },
    staleTime: 0,
  });

  const updateJDMutation = useMutation({
    mutationFn: ({ id, content }) => recruitmentApi.updateJD(id, content),
    onSuccess: () => {
      toast.success('JD changes saved!');
      setViewJD(prev => prev ? { ...prev, jd: { ...prev.jd, content: editContent } } : null);
      setEditingJD(false);
      queryClient.invalidateQueries({ queryKey: ['manager-jd-approvals'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const decideMutation = useMutation({
    mutationFn: ({ positionId, action }) => recruitmentApi.approveJD(positionId, {
      action,
      comment,
      min_score: minScore ? parseInt(minScore) : undefined,
    }),
    onSuccess: (_, { action }) => {
      toast.success(action === 'approve' ? '✅ JD Approved! Position is now open.' : '❌ JD Rejected.');
      setDecideModal(null); setMinScore('70'); setComment('');
      queryClient.invalidateQueries({ queryKey: ['manager-jd-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Action failed'),
  });

  const allApprovals = data || [];
  const filtered = filterStatus === 'all'
    ? allApprovals
    : allApprovals.filter(a => a.status === filterStatus);

  const pendingCount = allApprovals.filter(a => a.status === 'pending').length;

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">JD Approvals</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} JD${pendingCount > 1 ? 's' : ''} waiting for your review`
              : 'All JDs reviewed'}
            {' · '}{allApprovals.length} total
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'all',      label: 'All' },
          { key: 'pending',  label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {f.label}
            {f.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">
            {filterStatus === 'pending' ? 'No JDs pending your review' : 'No JDs in this category'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(approval => {
            const pos = approval.position;
            const jd  = pos?.descriptions?.[0];
            if (!pos) return null;

            return (
              <div key={approval.id}
                className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-md ${approval.status === 'pending' ? 'border-yellow-300 shadow-sm' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{pos.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[approval.status]}`}>
                        {approval.status === 'pending' ? '⏳ Awaiting Your Review' :
                         approval.status === 'approved' ? '✅ You Approved' : '❌ You Rejected'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{pos.department}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                      {pos.salary_lpa && <span className="text-gray-700 font-medium">💰 {pos.salary_lpa} LPA</span>}
                      {pos.experience_years && <span className="text-gray-600">🎯 {pos.experience_years} yrs</span>}
                      {pos.deadline && (
                        <span className={new Date(pos.deadline) < new Date() ? 'text-red-500 font-medium' : 'text-orange-500'}>
                          ⏰ {formatIndianDate(pos.deadline)}
                        </span>
                      )}
                      {pos.min_score && <span className="text-gray-500">Min Score: {pos.min_score}/100</span>}
                    </div>

                    <p className="text-xs text-gray-400 mt-1.5">
                      {pos.hrCreator && <>By HR: {pos.hrCreator.first_name} {pos.hrCreator.last_name} · </>}
                      Received: {formatIndianDate(approval.created_at)}
                    </p>

                    {approval.comment && approval.status !== 'pending' && (
                      <p className="text-xs text-gray-500 mt-1 italic">Your comment: "{approval.comment}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {jd && (
                      <Button size="sm" variant="outline"
                        onClick={() => { setViewJD({ position: pos, jd, approvalStatus: approval.status }); setEditingJD(false); setEditContent(''); }}>
                        View JD
                      </Button>
                    )}

                    {approval.status === 'pending' && (
                      <Button size="sm"
                        onClick={() => { setDecideModal({ positionId: pos.id, title: pos.title, minScore: pos.min_score }); setMinScore(String(pos.min_score || 70)); setComment(''); }}>
                        Review & Decide
                      </Button>
                    )}

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

      {/* ── View JD Modal ─────────────────────────────────────────── */}
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
              {viewJD.position.experience_years && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Experience</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewJD.position.experience_years} years</p>
                </div>
              )}
              {viewJD.position.deadline && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Deadline</p>
                  <p className="font-medium text-orange-700 mt-0.5">{formatIndianDate(viewJD.position.deadline)}</p>
                </div>
              )}
            </div>

            {/* JD header + edit toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Job Description</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">🤖 AI Generated</span>
              </div>
              {viewJD.approvalStatus === 'pending' && !editingJD && (
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
                <p className="text-xs text-gray-400">Edit the JD content. Your changes will be saved before you approve.</p>
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
                      💾 Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewJD.jd.content}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              {viewJD.approvalStatus === 'pending' && !editingJD && (
                <Button onClick={() => {
                  setDecideModal({ positionId: viewJD.position.id, title: viewJD.position.title, minScore: viewJD.position.min_score });
                  setMinScore(String(viewJD.position.min_score || 70));
                  setComment('');
                  setViewJD(null);
                }}>
                  Review & Decide
                </Button>
              )}
              <Button variant="secondary" onClick={() => { setViewJD(null); setEditingJD(false); setEditContent(''); }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Approve / Reject Modal ────────────────────────────────── */}
      <Modal isOpen={!!decideModal} onClose={() => setDecideModal(null)}
        title={`Review JD — ${decideModal?.title}`} size="sm">
        {decideModal && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <p className="font-medium">Set the minimum resume score</p>
              <p className="text-xs mt-0.5 text-yellow-700">AI will shortlist candidates who score above this threshold when resumes are uploaded.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Min Resume Score (1–100) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min="40" max="95" step="5" value={minScore}
                  onChange={e => setMinScore(e.target.value)} className="flex-1" />
                <span className="text-lg font-bold text-blue-600 w-12 text-right">{minScore}</span>
              </div>
              <p className="text-xs text-gray-400">
                {minScore >= 80 ? '🔴 Very strict — only top matches' :
                 minScore >= 65 ? '🟡 Moderate — good candidates' :
                 '🟢 Lenient — more candidates pass'}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Comment <span className="text-xs text-gray-400 font-normal">(required for rejection)</span>
              </label>
              <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a review comment..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                disabled={decideMutation.isPending}
                onClick={() => decideMutation.mutate({ positionId: decideModal.positionId, action: 'approve' })}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {decideMutation.isPending ? 'Processing...' : '✓ Approve JD'}
              </button>
              <button
                disabled={decideMutation.isPending || !comment.trim()}
                onClick={() => decideMutation.mutate({ positionId: decideModal.positionId, action: 'reject' })}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
                ✕ Reject JD
              </button>
            </div>
            {!comment.trim() && <p className="text-xs text-gray-400 text-center">Add a comment to enable rejection</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
