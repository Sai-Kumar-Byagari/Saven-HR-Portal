import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../../api/recruitment.api';
import { interviewsApi } from '../../api/interviews.api';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';

const ROUND_LABELS = { phone: '📞 Round 1 — Telephonic', technical: '💻 Round 2 — Technical', hr: '🤝 Round 3 — Final HR' };
const STATUS_COLORS = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

export default function InterviewsPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [expandedPosition, setExpandedPosition] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['positions', 'interviews-view'],
    queryFn: async () => {
      const r = await recruitmentApi.getPositions({ limit: 50 });
      return r.data;
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  // Managers only see positions where they approved the JD (approved_by_manager)
  const allPositions = (data?.data || []).filter(p => ['open','pending_approval'].includes(p.status));
  const positions = (user?.role === 'manager')
    ? allPositions.filter(p => p.approved_by_manager === user?.id || p.assignedManager?.id === user?.id)
    : allPositions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Interview Pipeline</h1>
        <p className="text-gray-400 text-sm mt-1">
          Track candidates through all 3 interview rounds
        </p>
      </div>

      {positions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-gray-500 font-medium">No open positions with interviews</p>
          <p className="text-sm text-gray-400 mt-1">Create a position and upload resumes to start the interview process</p>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map(pos => (
            <div key={pos.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Position header */}
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedPosition(expandedPosition === pos.id ? null : pos.id)}
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{pos.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{pos.department}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={pos.status} />
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedPosition===pos.id?'rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
                  </svg>
                </div>
              </button>

              {/* Candidates for this position */}
              {expandedPosition === pos.id && (
                <CandidateRoundsList positionId={pos.id} navigate={navigate} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateRoundsList({ positionId, navigate }) {
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', positionId, 'interview'],
    queryFn: async () => {
      // Fetch shortlisted + in_progress candidates (both can be in interview rounds)
      const [r1, r2] = await Promise.all([
        recruitmentApi.getCandidates(positionId, { status: 'shortlisted' }),
        recruitmentApi.getCandidates(positionId, { status: 'in_progress' }),
      ]);
      const all = [...(r1.data.data || []), ...(r2.data.data || [])];
      // Deduplicate by id
      const seen = new Set();
      return all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    },
  });

  if (isLoading) return <div className="p-5 flex justify-center"><Spinner /></div>;
  const candidates = data || [];

  if (candidates.length === 0) {
    return <div className="p-5 text-sm text-gray-400 text-center border-t border-gray-100">No shortlisted or in-progress candidates yet. Upload and shortlist resumes first.</div>;
  }

  return (
    <div className="border-t border-gray-100">
      {candidates.map(candidate => (
        <CandidateRow key={candidate.id} candidate={candidate} navigate={navigate} />
      ))}
    </div>
  );
}

function CandidateRow({ candidate, navigate }) {
  const [scheduleModal, setScheduleModal] = useState(null); // { roundNum, roundType }
  const [scheduleForm, setScheduleForm] = useState({ scheduled_at: '', meeting_link: '', duration_mins: '60' });

  const { data: rounds, refetch } = useQuery({
    queryKey: ['rounds', candidate.id],
    queryFn: async () => { const r = await interviewsApi.getRounds(candidate.id); return r.data.data; },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => interviewsApi.schedule(data),
    onSuccess: () => {
      toast.success('Interview scheduled! Calendar invites sent to HR and manager.');
      setScheduleModal(null);
      setScheduleForm({ scheduled_at: '', meeting_link: '', duration_mins: '60' });
      refetch();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to schedule'),
  });

  const roundList = rounds || [];
  const getRound = (num) => roundList.find(r => r.round_number === num);
  const ROUND_TYPES = { 1: 'phone', 2: 'technical', 3: 'hr' };
  const ROUND_LABELS = { 1: '📞 Telephonic', 2: '💻 Technical', 3: '🤝 Final HR' };

  return (
    <div className="px-5 py-4 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
            {candidate.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
            <p className="text-xs text-gray-400">{candidate.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {candidate.ai_score != null && (
            <span className={`text-sm font-bold ${candidate.ai_score>=70?'text-green-600':'text-orange-500'}`}>
              Resume: {candidate.ai_score}/100
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate(`/recruitment/candidates/${candidate.id}`)}>
            Full Profile
          </Button>
        </div>
      </div>

      {/* 3 round pipeline */}
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(num => {
          const round = getRound(num);
          return (
            <div key={num} className={`rounded-lg border p-2.5 text-xs ${
              round?.status==='completed' ? 'bg-green-50 border-green-200' :
              round?.status==='scheduled' ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'}`}>
              <p className="font-medium text-gray-700">{ROUND_LABELS[num]}</p>
              {round ? (
                <>
                  <p className={`mt-0.5 font-medium ${round.status==='completed'?'text-green-700':round.status==='scheduled'?'text-blue-700':'text-gray-600'}`}>
                    {round.status}
                  </p>
                  {round.scheduled_at && (
                    <p className="text-gray-500 mt-0.5">
                      {new Date(round.scheduled_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      {' '}
                      {new Date(round.scheduled_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                    </p>
                  )}
                  {round.meeting_link && (
                    <a href={round.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="mt-0.5 text-blue-600 hover:underline block truncate">
                      🔗 Join Meeting
                    </a>
                  )}
                  {round.ai_score != null && <p className="text-gray-500 mt-0.5">AI: {round.ai_score}/100</p>}
                  {round.status !== 'completed' && (
                    <button onClick={() => navigate(`/interviews/rounds/${round.id}`)}
                      className="mt-1 text-blue-600 hover:underline font-medium">
                      Add Feedback →
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => { setScheduleModal({ roundNum: num, roundType: ROUND_TYPES[num] }); setScheduleForm({ scheduled_at:'', meeting_link:'', duration_mins:'60' }); }}
                  className="mt-1 text-blue-600 hover:text-blue-800 font-medium hover:underline">
                  + Schedule
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Schedule {ROUND_LABELS[scheduleModal.roundNum]}</h3>
              <button onClick={() => setScheduleModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <strong>📅 Calendar invites</strong> will be automatically sent to HR and the assigned manager's <code>@saven.in</code> email with a .ics file to add to their Outlook/Teams calendar.
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Date & Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={scheduleForm.scheduled_at} onChange={e => setScheduleForm(p=>({...p, scheduled_at:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Teams/Zoom Meeting Link</label>
              <input type="url" value={scheduleForm.meeting_link} onChange={e => setScheduleForm(p=>({...p, meeting_link:e.target.value}))}
                placeholder="https://teams.microsoft.com/l/meetup-join/..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400">Create meeting in Teams → copy link → paste here</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Duration</label>
              <select value={scheduleForm.duration_mins} onChange={e => setScheduleForm(p=>({...p, duration_mins:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setScheduleModal(null)}>Cancel</Button>
              <Button
                loading={scheduleMutation.isPending}
                disabled={!scheduleForm.scheduled_at}
                onClick={() => scheduleMutation.mutate({
                  candidate_id: candidate.id,
                  round_number: scheduleModal.roundNum,
                  round_type: scheduleModal.roundType,
                  scheduled_at: scheduleForm.scheduled_at,
                  meeting_link: scheduleForm.meeting_link || null,
                  duration_mins: parseInt(scheduleForm.duration_mins),
                })}
                className="flex-1"
              >
                📅 Schedule & Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
