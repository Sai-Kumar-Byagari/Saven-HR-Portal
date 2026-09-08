import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { interviewsApi } from '../../api/interviews.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500';
  return (
    <span className={`text-2xl font-bold ${color}`}>
      {score}<span className="text-sm text-gray-400">/100</span>
    </span>
  );
}

function FeedbackBlock({ feedback }) {
  if (!feedback) return null;
  let parsed = null;
  try { parsed = JSON.parse(feedback); } catch { parsed = null; }

  if (!parsed) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Evaluation</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback}</p>
      </div>
    );
  }

  // Determine evaluation source
  const source = parsed.evaluation_source;
  const sourceBadge = source === 'auto_transcript'
    ? { label: '🎙️ Evaluated from Recording Transcript', cls: 'bg-green-50 border-green-200 text-green-800' }
    : { label: '📝 Evaluated from Interviewer Notes', cls: 'bg-blue-50 border-blue-200 text-blue-800' };

  // Score keys
  const scoreKeys = Object.entries(parsed).filter(([k, v]) => k.endsWith('_score') && typeof v === 'number');
  const textKeys = Object.entries(parsed).filter(([k, v]) =>
    !k.endsWith('_score') && k !== 'evaluation_source' && v && typeof v === 'string' && v !== 'N/A'
  );
  const arrayKeys = Object.entries(parsed).filter(([k, v]) => Array.isArray(v) && v.length > 0);

  const formatLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-3">
      {/* Source badge */}
      <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${sourceBadge.cls}`}>
        {sourceBadge.label}
      </div>

      {/* Scores grid */}
      {scoreKeys.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {scoreKeys.map(([k, v]) => (
            <div key={k} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">{formatLabel(k)}</p>
              <p className={`text-lg font-bold ${v >= 70 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                {v}<span className="text-xs text-gray-400 font-normal">/100</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation highlight */}
      {(parsed.recommendation || parsed.final_recommendation) && (() => {
        const rec = (parsed.recommendation || parsed.final_recommendation || '').toLowerCase();
        const recColor = rec.includes('proceed') || rec.includes('hire') ? 'bg-green-100 text-green-800 border-green-300'
          : rec.includes('hold') ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
          : 'bg-red-100 text-red-700 border-red-300';
        return (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold text-sm ${recColor}`}>
            <span>{rec.includes('proceed') || rec.includes('hire') ? '✅' : rec.includes('hold') ? '⏸' : '❌'}</span>
            Recommendation: {parsed.recommendation || parsed.final_recommendation}
          </div>
        );
      })()}

      {/* Text fields */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        {textKeys.map(([k, v]) => (
          <div key={k}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{formatLabel(k)}</p>
            <p className="text-sm text-gray-700">{v}</p>
          </div>
        ))}
        {arrayKeys.map(([k, v]) => (
          <div key={k}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{formatLabel(k)}</p>
            <ul className="flex flex-wrap gap-1.5 mt-1">
              {v.map((item, i) => (
                <li key={i} className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoundDetailPage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('');
  const [decisionComment, setDecisionComment] = useState('');
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const recordingRef = useRef(null);

  const { data: round, isLoading: loadingRound } = useQuery({
    queryKey: ['round', roundId],
    queryFn: async () => {
      const r = await interviewsApi.getRoundById(roundId);
      return r.data.data;
    },
    enabled: !!roundId,
  });

  const feedbackMutation = useMutation({
    mutationFn: () => interviewsApi.submitFeedback(roundId, { notes }),
    onSuccess: () => {
      toast.success('Feedback submitted and AI evaluated!');
      queryClient.invalidateQueries({ queryKey: ['round', roundId] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      setNotes('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit'),
  });

  const decisionMutation = useMutation({
    mutationFn: () => interviewsApi.makeDecision(roundId, { decision, comment: decisionComment }),
    onSuccess: () => {
      toast.success(`Decision recorded: ${decision}`);
      queryClient.invalidateQueries({ queryKey: ['round', roundId] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  async function handleRecordingUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRecording(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('recording', file);
      if (notes.trim()) fd.append('notes', notes);
      const res = await interviewsApi.uploadRecording(roundId, fd);
      const result = res.data;

      if (result.data?.transcribed === false && result.data?.transcription_note) {
        // Transcription failed or not available
        setUploadResult({ type: 'warning', message: result.message, note: result.data.transcription_note });
        toast(result.message, { icon: '⚠️' });
      } else {
        setUploadResult({ type: 'success', message: 'Recording transcribed and AI evaluated!' });
        toast.success('Recording transcribed and AI evaluated!');
      }
      queryClient.invalidateQueries({ queryKey: ['round', roundId] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      setUploadResult({ type: 'error', message: msg });
      toast.error(msg);
    } finally {
      setUploadingRecording(false);
      // Reset file input
      if (recordingRef.current) recordingRef.current.value = '';
    }
  }

  if (loadingRound) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-2 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Interview Evaluation</h1>
        <p className="text-gray-400 text-sm mt-1">Submit notes or upload recording — AI will evaluate and score the candidate</p>
      </div>

      {/* Round context banner */}
      {round && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{round.candidate?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                round.round_type === 'phone' ? 'bg-blue-100 text-blue-700' :
                round.round_type === 'technical' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'}`}>
                Round {round.round_number} — {round.round_type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                round.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {round.status}
              </span>
              {round.recording_path && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                  🎥 Recording uploaded
                </span>
              )}
            </div>
            {round.candidate?.position && (
              <p className="text-xs text-gray-400 mt-0.5">Position: {round.candidate.position.title}</p>
            )}
          </div>
          {round.ai_score != null && (
            <div className="text-center">
              <ScoreBadge score={round.ai_score} />
              <p className="text-xs text-gray-400 mt-0.5">AI Score</p>
            </div>
          )}
        </div>
      )}

      {/* Previous AI feedback */}
      {round?.ai_feedback && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
          <p className="text-sm font-semibold text-gray-700 mb-3">🤖 AI Evaluation Result</p>
          <FeedbackBlock feedback={round.ai_feedback} />
        </div>
      )}

      {/* Upload recording — PRIMARY method */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎥</span>
          <div>
            <h2 className="font-semibold text-gray-900">Upload Interview Recording</h2>
            <p className="text-xs text-green-600 font-medium mt-0.5">✅ Audio/Video is automatically transcribed by AI</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <strong>How it works:</strong> Upload any audio or video recording of the interview.
          Our AI automatically transcribes the conversation using Groq Whisper, then evaluates the candidate
          based on what was actually said — giving you a fully objective AI score.
        </div>

        <div className="text-xs text-gray-500 space-y-0.5">
          <p>Supported formats: <span className="font-medium">MP3, MP4, WAV, WebM, OGG, M4A, MOV, AVI</span></p>
          <p>Max size: <span className="font-medium">25 MB</span> for automatic transcription</p>
        </div>

        {uploadResult && (
          <div className={`rounded-lg p-3 text-sm ${
            uploadResult.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            uploadResult.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
            'bg-red-50 border border-red-200 text-red-700'}`}>
            {uploadResult.message}
            {uploadResult.note && <p className="mt-1 text-xs opacity-80">{uploadResult.note}</p>}
          </div>
        )}

        <input
          ref={recordingRef}
          type="file"
          accept="audio/*,video/*,.pdf,.docx,.txt"
          className="hidden"
          onChange={handleRecordingUpload}
        />
        <button
          onClick={() => recordingRef.current?.click()}
          disabled={uploadingRecording}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingRecording ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              Transcribing and evaluating... this may take a moment
            </span>
          ) : (
            <div className="space-y-1 text-center">
              <p className="text-2xl">📁</p>
              <p>Click to upload audio or video recording</p>
              <p className="text-xs text-gray-400">MP3, MP4, WAV, WebM, OGG, M4A • Max 25MB</p>
            </div>
          )}
        </button>
      </div>

      {/* Manual notes — secondary/supplement */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <div>
            <h2 className="font-semibold text-gray-900">Written Notes (Alternative)</h2>
            <p className="text-xs text-gray-400 mt-0.5">If no recording — write your observations here for AI evaluation</p>
          </div>
        </div>
        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Write your interview observations here. Be as detailed as possible for accurate AI scoring.\n\nExample:\n- Candidate has 5 years React experience, worked on large-scale apps\n- Strong problem-solving skills, solved DSA questions efficiently\n- Communication is clear and professional\n- Lacks experience with microservices architecture\n- Salary expectation: ₹15 LPA, notice period: 30 days`}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <Button
          onClick={() => feedbackMutation.mutate()}
          loading={feedbackMutation.isPending}
          disabled={!notes.trim()}
          className="w-full"
        >
          {feedbackMutation.isPending ? '🤖 AI Evaluating...' : 'Submit Notes & Get AI Score'}
        </Button>
      </div>

      {/* Final decision */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚖️</span>
          <h2 className="font-semibold text-gray-900">Final Hiring Decision</h2>
        </div>
        <p className="text-sm text-gray-500">After all rounds are complete, record the final hiring decision.</p>

        <div className="flex gap-3">
          {['selected', 'hold', 'rejected'].map((d) => (
            <button
              key={d}
              onClick={() => setDecision(d)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                decision === d
                  ? d === 'selected' ? 'bg-green-600 text-white border-green-600'
                    : d === 'hold' ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d === 'selected' ? '✅ Hire' : d === 'hold' ? '⏸ Hold' : '❌ Reject'}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          value={decisionComment}
          onChange={(e) => setDecisionComment(e.target.value)}
          placeholder="Add a comment for this decision..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <Button
          onClick={() => decisionMutation.mutate()}
          loading={decisionMutation.isPending}
          disabled={!decision}
          variant={decision === 'selected' ? 'primary' : decision === 'rejected' ? 'danger' : 'secondary'}
          className="w-full"
        >
          {decisionMutation.isPending ? 'Saving...' : 'Save Decision'}
        </Button>
      </div>
    </div>
  );
}
