import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { teamsApi } from '../../api/teams.api';
import { queryClient } from '../../config/queryClient';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { formatIndianDate } from '../../utils/dateHelpers';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700 border-green-200',
  planning:  'bg-blue-100 text-blue-700 border-blue-200',
  on_hold:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Track seen messages in localStorage ──────────────────────────────────────
function getSeenKey(userId) { return `seen_msgs_${userId}`; }

function getSeenTs(userId) {
  try { return parseInt(localStorage.getItem(getSeenKey(userId)) || '0'); }
  catch { return 0; }
}

function markAllSeen(userId) {
  try { localStorage.setItem(getSeenKey(userId), String(Date.now())); }
  catch {}
}

// ── Single message thread card ────────────────────────────────────────────────
function MessageThread({ msg, projectId, projectName, teamColor, userId }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const replyMutation = useMutation({
    mutationFn: () => teamsApi.replyMessage(projectId, msg.id, { message: replyText }),
    onSuccess: () => {
      toast.success('Reply sent!');
      setReplyText(''); setShowReply(false);
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const isForMe = !msg.target_user_id || msg.target_user_id === userId;
  if (!isForMe) return null;

  const isQuery = msg.type === 'query';
  const hasMyReply = (msg.replies || []).some(r => r.sender?.id === userId);

  return (
    <div className={`rounded-xl border p-4 ${isQuery ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
      {/* Project label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ background: teamColor }} />
        <span className="text-xs font-medium text-gray-500">{projectName}</span>
        {!hasMyReply && isQuery && (
          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">Needs Reply</span>
        )}
      </div>

      {/* Message */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{isQuery ? '❓' : '📢'}</span>
            <span className="text-sm font-semibold text-gray-900">
              {msg.sender?.first_name} {msg.sender?.last_name}
            </span>
            {msg.target_user_id === userId && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">→ You</span>
            )}
            <span className="text-xs text-gray-400">{timeAgo(msg.created_at)}</span>
          </div>
          <p className="text-sm text-gray-800 mt-1 font-medium">{msg.message}</p>
        </div>
        {isQuery && !showReply && (
          <button onClick={() => setShowReply(true)}
            className="shrink-0 text-xs text-blue-600 border border-blue-300 bg-white px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium">
            Reply
          </button>
        )}
      </div>

      {/* Existing replies */}
      {(msg.replies || []).length > 0 && (
        <div className="mt-3 ml-5 space-y-2 border-l-2 border-gray-200 pl-3">
          {msg.replies.map(r => (
            <div key={r.id} className="text-sm">
              <span className={`font-semibold ${r.sender?.id === userId ? 'text-blue-600' : 'text-gray-800'}`}>
                {r.sender?.id === userId ? 'You' : `${r.sender?.first_name} ${r.sender?.last_name}`}
              </span>
              <span className="text-gray-400 text-xs ml-2">{timeAgo(r.created_at)}</span>
              <p className="text-gray-600 mt-0.5">{r.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inline reply form */}
      {showReply && (
        <div className="mt-3 flex gap-2 ml-1">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) { e.preventDefault(); replyMutation.mutate(); } }}
            placeholder="Type your reply and press Enter..."
            autoFocus
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button size="sm" loading={replyMutation.isPending} disabled={!replyText.trim()}
            onClick={() => replyMutation.mutate()}>Send</Button>
          <button onClick={() => { setShowReply(false); setReplyText(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Project card (used in Projects tab) ──────────────────────────────────────
function ProjectCard({ membership, project, teamColor, teamName }) {
  const user = useAppSelector(selectUser);
  const [updateModal, setUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ message: '', progress_pct: '' });

  const postUpdateMutation = useMutation({
    mutationFn: () => teamsApi.postUpdate(project.id, {
      message: updateForm.message,
      progress_pct: updateForm.progress_pct !== '' ? parseInt(updateForm.progress_pct) : undefined,
    }),
    onSuccess: () => {
      toast.success('Daily update posted!');
      setUpdateModal(false);
      setUpdateForm({ message: '', progress_pct: '' });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: teamColor }} />
            <span className="text-xs text-gray-400 font-medium">{teamName}</span>
            {membership?.tech_role && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{membership.tech_role}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[project.status] || STATUS_COLORS.planning}`}>
              {project.status?.replace('_', ' ')}
            </span>
          </div>
          {project.tech_stack && <p className="text-xs text-gray-400 mt-0.5">Tech: {project.tech_stack}</p>}
          <div className="flex gap-4 text-xs mt-0.5 flex-wrap">
            {project.start_date && <span className="text-gray-400">Start: {formatIndianDate(project.start_date)}</span>}
            {project.end_date && <span className="text-orange-500 font-medium">⏰ Deadline: {formatIndianDate(project.end_date)}</span>}
          </div>
        </div>
        <Button size="sm" onClick={() => setUpdateModal(true)} className="shrink-0">+ Daily Update</Button>
      </div>

      {/* My responsibilities */}
      {membership?.responsibilities && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-blue-700 mb-0.5">My Responsibilities</p>
          <p className="text-xs text-blue-800 whitespace-pre-line">{membership.responsibilities}</p>
          {membership.member_deadline && (
            <p className="text-xs text-orange-500 font-medium mt-1">⏰ My Deadline: {formatIndianDate(membership.member_deadline)}</p>
          )}
        </div>
      )}

      {/* Recent updates */}
      {(project.updates || []).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Updates</p>
          {(project.updates || []).slice(0, 3).map(upd => (
            <div key={upd.id} className="flex gap-2.5 pb-2 border-b border-gray-50 last:border-0">
              <Avatar name={`${upd.author?.first_name} ${upd.author?.last_name}`} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${upd.author?.id === user?.id ? 'text-blue-600' : 'text-gray-800'}`}>
                    {upd.author?.id === user?.id ? 'You' : `${upd.author?.first_name} ${upd.author?.last_name}`}
                  </span>
                  {upd.progress_pct != null && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{upd.progress_pct}%</span>
                  )}
                  <span className="text-[11px] text-gray-400">{timeAgo(upd.created_at)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{upd.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily update modal */}
      <Modal isOpen={updateModal} onClose={() => setUpdateModal(false)} title={`Daily Update — ${project.name}`} size="sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">What did you work on today? <span className="text-red-500">*</span></label>
            <textarea rows={4} value={updateForm.message} onChange={e => setUpdateForm(p => ({...p, message: e.target.value}))}
              placeholder="Describe your progress, what you completed, blockers..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Overall progress (%)</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" step="5" value={updateForm.progress_pct || 0}
                onChange={e => setUpdateForm(p => ({...p, progress_pct: e.target.value}))}
                className="flex-1" />
              <span className="text-sm font-bold text-blue-600 w-10 text-right">{updateForm.progress_pct || 0}%</span>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setUpdateModal(false)}>Cancel</Button>
            <Button loading={postUpdateMutation.isPending} disabled={!updateForm.message.trim()}
              onClick={() => postUpdateMutation.mutate()}>Post Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyProjectsPage() {
  const user = useAppSelector(selectUser);
  const [activeTab, setActiveTab] = useState('messages');
  const [seenTs, setSeenTs] = useState(() => getSeenTs(user?.id));

  const { data, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => { const r = await teamsApi.getMyProjects(); return r.data.data; },
    staleTime: 0,
  });

  const memberships = data || [];

  // Flatten all messages across all projects, attach project context
  const allMessages = memberships.flatMap(m =>
    (m.projects || []).flatMap(p =>
      (p.messages || [])
        .filter(msg => !msg.target_user_id || msg.target_user_id === user?.id)
        .map(msg => ({
          ...msg,
          _projectId:   p.id,
          _projectName: p.name,
          _teamColor:   m.team.color,
          _teamName:    m.team.name,
        }))
    )
  );

  // Sort newest first
  allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Count new messages (arrived after last seen timestamp)
  const newMsgCount = allMessages.filter(msg =>
    new Date(msg.created_at).getTime() > seenTs
  ).length;

  // When user opens messages tab — mark all as seen
  const handleMessagesTab = useCallback(() => {
    setActiveTab('messages');
    markAllSeen(user?.id);
    setSeenTs(Date.now());
  }, [user?.id]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (memberships.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
        <p className="text-3xl mb-3">🏗️</p>
        <p className="text-lg font-medium text-gray-700">No projects assigned yet</p>
        <p className="text-sm text-gray-400 mt-1">Your manager will add you to a team and assign projects with responsibilities</p>
      </div>
    );
  }

  // Flatten all projects for the Projects tab
  const allProjects = memberships.flatMap(m =>
    (m.projects || []).map(p => ({
      project: p,
      membership: m.membership,
      teamColor: m.team.color,
      teamName: m.team.name,
    }))
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Projects</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your projects, daily updates, and messages from your manager</p>
      </div>

      {/* Top-level tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {/* Messages tab — shows new count badge */}
        <button
          onClick={handleMessagesTab}
          className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'messages' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          💬 Messages
          {newMsgCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {newMsgCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'projects' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          🏗 Projects ({allProjects.length})
        </button>
      </div>

      {/* ── MESSAGES TAB — all messages across all projects ─────────── */}
      {activeTab === 'messages' && (
        <div className="space-y-3">
          {allMessages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Your manager will post announcements or questions here</p>
            </div>
          ) : (
            allMessages.map(msg => (
              <MessageThread
                key={msg.id}
                msg={msg}
                projectId={msg._projectId}
                projectName={msg._projectName}
                teamColor={msg._teamColor}
                userId={user?.id}
              />
            ))
          )}
        </div>
      )}

      {/* ── PROJECTS TAB ───────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {allProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              No projects yet
            </div>
          ) : (
            allProjects.map(({ project, membership, teamColor, teamName }) => (
              <ProjectCard
                key={project.id}
                project={project}
                membership={membership}
                teamColor={teamColor}
                teamName={teamName}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
