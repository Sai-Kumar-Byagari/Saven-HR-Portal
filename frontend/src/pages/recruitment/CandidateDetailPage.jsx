import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { recruitmentApi } from '../../api/recruitment.api';
import { interviewsApi } from '../../api/interviews.api';
import { queryClient } from '../../config/queryClient';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const ROUNDS = [
  { number: 1, type: 'phone',     label: 'Round 1 — Telephonic',  icon: '📞', who: 'HR',      desc: 'Initial screening call' },
  { number: 2, type: 'technical', label: 'Round 2 — Technical',   icon: '💻', who: 'Manager', desc: 'Technical assessment' },
  { number: 3, type: 'hr',        label: 'Round 3 — Final HR',    icon: '🤝', who: 'HR',      desc: 'Culture fit & offer' },
];

function ScoreCircle({ score }) {
  if (score == null) return <span className="text-gray-300 text-sm">Not evaluated</span>;
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  return <span className={`text-xl font-bold ${color}`}>{score}<span className="text-xs text-gray-400">/100</span></span>;
}

function parseAIFeedback(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export default function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scheduleModal, setScheduleModal] = useState(null); // round config
  const [scheduleForm, setScheduleForm] = useState({ scheduled_at: '', meeting_link: '', duration_mins: '60' });

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => { const r = await recruitmentApi.getCandidate(id); return r.data.data; },
  });

  const { data: roundsData, refetch: refetchRounds } = useQuery({
    queryKey: ['rounds', id],
    queryFn: async () => { const r = await interviewsApi.getRounds(id); return r.data.data; },
    enabled: !!id,
  });

  const scheduleMutation = useMutation({
    mutationFn: (roundConfig) => interviewsApi.schedule(roundConfig),
    onSuccess: () => {
      toast.success('Interview scheduled! Calendar invites sent to HR and manager.');
      setScheduleModal(null);
      setScheduleForm({ scheduled_at: '', meeting_link: '', duration_mins: '60' });
      queryClient.invalidateQueries({ queryKey: ['rounds', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to schedule'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-center py-20 text-red-500">Candidate not found.</div>;

  const rounds = roundsData || [];
  const getRound = (num) => rounds.find(r => r.round_number === num);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Candidate header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
              {data.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                {data.email && <span>✉️ {data.email}</span>}
                {data.phone && <span>📞 {data.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {data.ai_score != null && (
              <div className="text-center">
                <p className={`text-2xl font-bold ${data.ai_score >= 75 ? 'text-green-600' : data.ai_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {data.ai_score}<span className="text-sm text-gray-400">/100</span>
                </p>
                <p className="text-xs text-gray-400">Resume Score</p>
              </div>
            )}
            <StatusBadge status={data.status} />
          </div>
        </div>

        {/* Resume AI analysis */}
        {(data.ai_strengths || data.ai_gaps) && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {data.ai_strengths && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1">✓ Matched Skills / Strengths</p>
                <p className="text-xs text-green-800">{data.ai_strengths}</p>
              </div>
            )}
            {data.ai_gaps && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">✗ Missing Requirements</p>
                <p className="text-xs text-red-800">{data.ai_gaps}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interview Pipeline — 3 rounds */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Interview Pipeline</h2>
        <div className="space-y-4">
          {ROUNDS.map((roundConfig) => {
            const round = getRound(roundConfig.number);
            const isScheduled = !!round;
            const isCompleted = round?.status === 'completed';
            const hasFeedback = !!round?.ai_feedback;
            const feedback = parseAIFeedback(round?.ai_feedback);

            return (
              <div key={roundConfig.number} className={`bg-white rounded-xl border p-5 shadow-card ${
                isCompleted ? 'border-green-200' : isScheduled ? 'border-blue-200' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Status indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 font-bold ${
                      isCompleted ? 'bg-green-100 text-green-700' :
                      isScheduled ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? '✓' : roundConfig.number}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{roundConfig.icon} {roundConfig.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{roundConfig.desc} · Conducted by: {roundConfig.who}</p>
                      {round && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Status: <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>{round.status}</span>
                          {round.scheduled_at && (
                            <span className="ml-2 text-gray-500">
                              · {new Date(round.scheduled_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                              {' '}{new Date(round.scheduled_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                            </span>
                          )}
                          {round.final_decision && round.final_decision !== 'pending' && (
                            <span className={`ml-2 font-bold ${round.final_decision === 'selected' ? 'text-green-600' : round.final_decision === 'rejected' ? 'text-red-500' : 'text-yellow-600'}`}>
                              · Decision: {round.final_decision}
                            </span>
                          )}
                        </p>
                      )}
                      {round?.meeting_link && (
                        <a href={round.meeting_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-0.5 block">
                          🔗 Join Meeting
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {round?.ai_score != null && <ScoreCircle score={round.ai_score} />}
                    {!isScheduled ? (
                      <Button size="sm" variant="outline"
                        onClick={() => { setScheduleModal(roundConfig); setScheduleForm({ scheduled_at:'', meeting_link:'', duration_mins:'60' }); }}>
                        Schedule Round
                      </Button>
                    ) : (
                      <Button size="sm"
                        onClick={() => navigate(`/interviews/rounds/${round.id}`)}>
                        {isCompleted ? 'View / Update' : 'Add Feedback'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* AI feedback summary */}
                {hasFeedback && feedback && (
                  <div className="mt-4 border-t border-gray-100 pt-4 grid grid-cols-2 gap-3 text-xs">
                    {feedback.strengths && (
                      <div className="bg-green-50 rounded-lg p-2.5">
                        <p className="font-semibold text-green-700 mb-1">Strengths</p>
                        <p className="text-green-800">{feedback.strengths}</p>
                      </div>
                    )}
                    {(feedback.concerns || feedback.gaps) && (
                      <div className="bg-orange-50 rounded-lg p-2.5">
                        <p className="font-semibold text-orange-700 mb-1">Concerns</p>
                        <p className="text-orange-800">{feedback.concerns || feedback.gaps}</p>
                      </div>
                    )}
                    {feedback.recommendation && (
                      <div className="col-span-2 bg-blue-50 rounded-lg p-2.5">
                        <p className="font-semibold text-blue-700 mb-1">AI Recommendation</p>
                        <p className="text-blue-800 font-medium">{feedback.recommendation || feedback.final_recommendation}</p>
                        {feedback.detailed_feedback && <p className="text-blue-700 mt-1 font-normal">{feedback.detailed_feedback}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final decision summary */}
      {data.status === 'hired' && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-5 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-800 text-lg">Candidate Selected!</p>
          <p className="text-green-700 text-sm mt-1">Proceed with offer letter and onboarding.</p>
        </div>
      )}
      {data.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <p className="text-2xl mb-1">❌</p>
          <p className="font-bold text-red-700 text-lg">Candidate Rejected</p>
        </div>
      )}

      {/* Schedule round modal */}
      <Modal isOpen={!!scheduleModal} onClose={() => setScheduleModal(null)}
        title={`Schedule ${scheduleModal?.label}`} size="sm">
        {scheduleModal && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              📅 A <strong>calendar invite (.ics)</strong> will be emailed to HR and the assigned manager. They can open it in Outlook to add to their Teams calendar and click Accept.
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={scheduleForm.scheduled_at}
                onChange={e => setScheduleForm(p=>({...p, scheduled_at:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Teams / Zoom Meeting Link</label>
              <input type="url" value={scheduleForm.meeting_link}
                onChange={e => setScheduleForm(p=>({...p, meeting_link:e.target.value}))}
                placeholder="https://teams.microsoft.com/l/meetup-join/..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400">Create meeting in Teams → copy link → paste here</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Duration</label>
              <select value={scheduleForm.duration_mins}
                onChange={e => setScheduleForm(p=>({...p, duration_mins:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setScheduleModal(null)}>Cancel</Button>
              <Button
                loading={scheduleMutation.isPending}
                disabled={!scheduleForm.scheduled_at}
                onClick={() => scheduleMutation.mutate({
                  candidate_id: parseInt(id),
                  round_number: scheduleModal.number,
                  round_type: scheduleModal.type,
                  conducted_by: null,
                  scheduled_at: scheduleForm.scheduled_at,
                  meeting_link: scheduleForm.meeting_link || null,
                  duration_mins: parseInt(scheduleForm.duration_mins) || 60,
                })}
              >
                📅 Schedule & Send Invite
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
