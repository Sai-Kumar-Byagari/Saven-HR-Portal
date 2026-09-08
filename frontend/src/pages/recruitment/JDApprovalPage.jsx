import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { recruitmentApi } from '../../api/recruitment.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function JDApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [minScore, setMinScore] = useState('');
  const [editingJD, setEditingJD] = useState(false);
  const [editContent, setEditContent] = useState('');

  const { data: position, isLoading } = useQuery({
    queryKey: ['positions', id],
    queryFn: async () => { const r = await recruitmentApi.getPosition(id); return r.data.data; },
  });

  const retryMutation = useMutation({
    mutationFn: () => recruitmentApi.retryJD(id),
    onSuccess: () => {
      toast.success('JD regenerated successfully!');
      queryClient.invalidateQueries({ queryKey: ['positions', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'AI generation failed. Check your GROQ_API_KEY in backend/.env'),
  });

  const updateJDMutation = useMutation({
    mutationFn: () => recruitmentApi.updateJD(id, editContent),
    onSuccess: () => {
      toast.success('JD saved successfully!');
      setEditingJD(false);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['positions', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save JD'),
  });

  const approveMutation = useMutation({
    mutationFn: (action) => recruitmentApi.approveJD(id, { action, comment, min_score: minScore ? parseInt(minScore) : undefined }),
    onSuccess: (_, action) => {      toast.success(action === 'approve' ? 'JD approved! Position is now open.' : 'JD rejected.');
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      navigate('/recruitment/positions');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!position) return <div className="text-center py-20 text-red-500">Position not found.</div>;

  const jd = position.descriptions?.[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{position.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{position.department} · <StatusBadge status={position.status} /></p>
        </div>
      </div>

      {/* JD Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Job Description</h2>
          </div>
          {/* Edit toggle — only for pending/draft */}
          {jd && ['pending_approval', 'draft'].includes(position.status) && !editingJD && (
            <button
              onClick={() => { setEditingJD(true); setEditContent(jd.content); }}
              className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-300 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              ✏️ Edit JD
            </button>
          )}
          {editingJD && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-orange-600 font-medium">✏️ Editing mode</span>
              <button onClick={() => { setEditingJD(false); setEditContent(''); }}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 px-2 py-1 rounded-lg">
                Cancel
              </button>
            </div>
          )}
        </div>

        {jd ? (
          <div className="space-y-3">
            {jd.ai_status === 'failed' && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex-1">
                  ⚠ AI generation failed. Retry to generate the JD.
                </p>
                <Button size="sm" onClick={() => retryMutation.mutate()} loading={retryMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white border-0 shrink-0">
                  🔄 Retry AI
                </Button>
              </div>
            )}

            {editingJD ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Make your edits below. This will be the final JD used for this position.</p>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={18}
                  autoFocus
                  className="w-full border border-blue-300 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{editContent.length} characters</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingJD(false); setEditContent(''); }}
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Discard
                    </button>
                    <button
                      disabled={updateJDMutation.isPending || !editContent.trim()}
                      onClick={() => updateJDMutation.mutate()}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      {updateJDMutation.isPending
                        ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                        : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed border border-gray-200">
                {jd.content}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No JD generated yet</p>
        )}
      </div>

      {/* Position details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm space-y-2">
        <p><span className="text-gray-500">Required Skills:</span> <span className="text-gray-800">{position.required_skills || '—'}</span></p>
        <p><span className="text-gray-500">Experience:</span> <span className="text-gray-800">{position.experience_years || '—'} years</span></p>
        {position.salary_lpa && <p><span className="text-gray-500">Salary Offered:</span> <span className="font-semibold text-green-700">{position.salary_lpa} LPA</span></p>}
        {position.deadline && <p><span className="text-gray-500">Application Deadline:</span> <span className="text-orange-600 font-medium">{position.deadline}</span></p>}
        <p><span className="text-gray-500">Min AI Score:</span> <span className="text-gray-800">{position.min_score}/100</span></p>
      </div>

      {/* Approval actions */}
      {position.status === 'pending_approval' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Review Decision</h3>

          {/* Min score — manager sets the resume shortlist threshold */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Minimum Resume Score for Shortlisting <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-gray-400 font-normal">(out of 100 — AI will shortlist resumes above this)</span>
            </label>
            <input
              type="number"
              min="1" max="100"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder={`Current: ${position.min_score}/100`}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Comment <span className="text-gray-400 text-xs font-normal">(optional for approve, recommended for reject)</span></label>
            <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Add a review comment..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3">
            <button
              disabled={approveMutation.isPending || !minScore}
              onClick={() => approveMutation.mutate('approve')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {approveMutation.isPending ? 'Processing...' : '✓ Approve JD'}
            </button>
            <button
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate('reject')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              ✕ Reject JD
            </button>
          </div>
          {!minScore && (
            <p className="text-xs text-orange-600">⚠ Please set the minimum score before approving</p>
          )}
        </div>
      )}
    </div>
  );
}
