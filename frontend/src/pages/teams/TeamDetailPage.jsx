import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { teamsApi } from '../../api/teams.api';
import { usersApi } from '../../api/users.api';
import { queryClient } from '../../config/queryClient';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

const TECH_ROLES = ['Flutter Dev','React Dev','Backend Dev','Full Stack Dev','DevOps','QA Engineer','UI/UX Designer','Data Engineer','Mobile Dev','Product Manager','Scrum Master','Other'];
const STATUS_COLORS = { active:'bg-green-100 text-green-700', planning:'bg-blue-100 text-blue-700', on_hold:'bg-yellow-100 text-yellow-700', completed:'bg-gray-100 text-gray-600' };

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

function MessageBubble({ msg, projectId, projectLabel, currentUserId, onReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const replyMutation = useMutation({
    mutationFn: () => teamsApi.replyMessage(projectId, msg.id, { message: replyText }),
    onSuccess: () => {
      toast.success('Reply posted.');
      setReplyText(''); setShowReplyForm(false);
      queryClient.invalidateQueries({ queryKey: ['team', projectId] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const typeIcon = msg.type === 'query' ? '❓' : '📢';
  const typeBg   = msg.type === 'query' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';

  return (
    <div className={`rounded-xl border p-4 ${typeBg}`}>
      {/* Project label (when showing all threads) */}
      {projectLabel && (
        <p className="text-xs font-medium text-gray-400 mb-2">📁 {projectLabel}</p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-base mt-0.5">{typeIcon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">
                {msg.sender?.first_name} {msg.sender?.last_name}
              </span>
              {msg.targetUser && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  → {msg.targetUser.first_name} {msg.targetUser.last_name}
                </span>
              )}
              <span className="text-xs text-gray-400">{timeAgo(msg.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{msg.message}</p>
          </div>
        </div>
        <button onClick={() => setShowReplyForm(v => !v)}
          className="text-xs text-blue-600 hover:underline shrink-0 mt-0.5">
          Reply
        </button>
      </div>

      {/* Replies */}
      {(msg.replies || []).length > 0 && (
        <div className="mt-3 ml-6 space-y-2 border-l-2 border-gray-200 pl-3">
          {msg.replies.map(r => (
            <div key={r.id} className="text-sm">
              <span className="font-medium text-gray-800">{r.sender?.first_name} {r.sender?.last_name}</span>
              <span className="text-gray-400 text-xs ml-2">{timeAgo(r.created_at)}</span>
              <p className="text-gray-600 mt-0.5">{r.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="mt-3 ml-6 flex gap-2">
          <input value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && replyText.trim()) { e.preventDefault(); replyMutation.mutate(); }}}
            placeholder="Write a reply..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <Button size="sm" loading={replyMutation.isPending} disabled={!replyText.trim()}
            onClick={() => replyMutation.mutate()}>Send</Button>
        </div>
      )}
    </div>
  );
}

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [msgForm, setMsgForm] = useState({ message: '', type: 'announcement', target_user_id: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', tech_role: '', responsibilities: '', member_deadline: '' });
  const [projectForm, setProjectForm] = useState({ name:'', description:'', status:'active', start_date:'', end_date:'', tech_stack:'' });

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => { const r = await teamsApi.getById(id); return r.data.data; },
  });

  const { data: allEmployees } = useQuery({
    queryKey: ['users', 'my-direct-reports'],
    queryFn: async () => { const r = await usersApi.getTeam({ limit: 200 }); return r.data.data; },
  });

  const addMemberMutation = useMutation({
    mutationFn: () => teamsApi.addMember(id, { ...memberForm, user_id: parseInt(memberForm.user_id) }),
    onSuccess: () => { toast.success('Member added!'); setShowAddMember(false); setMemberForm({ user_id:'', tech_role:'', responsibilities:'', member_deadline:'' }); queryClient.invalidateQueries({ queryKey: ['team', id] }); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMemberMutation = useMutation({
    mutationFn: () => teamsApi.updateMember(id, editMember.user_id, { tech_role: editMember.tech_role, responsibilities: editMember.responsibilities, member_deadline: editMember.member_deadline }),
    onSuccess: () => { toast.success('Member updated!'); setEditMember(null); queryClient.invalidateQueries({ queryKey: ['team', id] }); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => teamsApi.removeMember(id, userId),
    onSuccess: () => { toast.success('Member removed.'); queryClient.invalidateQueries({ queryKey: ['team', id] }); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const createProjectMutation = useMutation({
    mutationFn: () => teamsApi.createProject({ ...projectForm, team_id: parseInt(id) }),
    onSuccess: () => { toast.success('Project created!'); setShowCreateProject(false); setProjectForm({ name:'', description:'', status:'active', start_date:'', end_date:'', tech_stack:'' }); queryClient.invalidateQueries({ queryKey: ['team', id] }); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const postMsgMutation = useMutation({
    mutationFn: () => teamsApi.postMessage(selectedProject?.id, { ...msgForm, target_user_id: msgForm.target_user_id || undefined }),
    onSuccess: () => { toast.success('Message posted!'); setMsgForm({ message:'', type:'announcement', target_user_id:'' }); queryClient.invalidateQueries({ queryKey: ['team', id] }); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <div className="space-y-4 animate-pulse">{[1,2].map(i=><div key={i} className="h-40 bg-gray-100 rounded-2xl"/>)}</div>;
  if (!team) return <div className="text-red-500 py-10 text-center">Team not found.</div>;

  const members = team.members || [];
  const projects = team.projects || [];
  const teamUserIds = members.map(m => m.user_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/teams')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: team.color }} />
            <h1 className="text-2xl font-semibold text-gray-900">{team.name}</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['members','👤 Members'], ['projects','🏗 Projects'], ['communicate','💬 Communicate'], ['updates','📋 Updates']].map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab===k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ────────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Team Members ({members.length})</h2>
            <Button size="sm" onClick={() => setShowAddMember(true)}>+ Add Member</Button>
          </div>
          {members.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No members yet. Add team members to get started.</p>
          ) : (
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar name={`${m.employee?.first_name} ${m.employee?.last_name}`} role={m.employee?.role} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.employee?.first_name} {m.employee?.last_name}</p>
                        <p className="text-xs text-gray-400">{m.employee?.work_email}</p>
                        {m.tech_role && <span className="mt-1 inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{m.tech_role}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEditMember({ user_id: m.user_id, tech_role: m.tech_role||'', responsibilities: m.responsibilities||'', member_deadline: m.member_deadline||'' })}
                        className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => removeMemberMutation.mutate(m.user_id)}
                        className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                  {m.responsibilities && (
                    <div className="mt-2 ml-12">
                      <p className="text-xs text-gray-500 font-medium">Responsibilities:</p>
                      <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-line">{m.responsibilities}</p>
                    </div>
                  )}
                  {m.member_deadline && (
                    <p className="mt-1 ml-12 text-xs text-orange-500 font-medium">⏰ Deadline: {formatIndianDate(m.member_deadline)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROJECTS TAB ───────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowCreateProject(true)}>+ New Project</Button>
          </div>
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400">No projects yet. Create a project to start working with your team.</p>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="bg-white rounded-2xl border-2 border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    {project.description && <p className="text-xs text-gray-400 mt-0.5">{project.description}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      {project.tech_stack && <span>Stack: <span className="text-gray-600">{project.tech_stack}</span></span>}
                      {project.start_date && <span>From: {formatIndianDate(project.start_date)}</span>}
                      {project.end_date && <span className="text-orange-500 font-medium">⏰ Deadline: {formatIndianDate(project.end_date)}</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-600'}`}>
                    {project.status?.replace('_',' ')}
                  </span>
                </div>
                {/* Members in this project */}
                <div className="flex -space-x-2 mt-2">
                  {members.slice(0,6).map(m => (
                    <div key={m.id} title={`${m.employee?.first_name} ${m.employee?.last_name}${m.tech_role ? ` — ${m.tech_role}` : ''}`}>
                      <Avatar name={`${m.employee?.first_name} ${m.employee?.last_name}`} size="sm" className="ring-2 ring-white" />
                    </div>
                  ))}
                  {members.length > 6 && <div className="w-8 h-8 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-xs text-gray-500">+{members.length-6}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── COMMUNICATE TAB ────────────────────────────────────────── */}
      {activeTab === 'communicate' && (
        <div className="space-y-4">

          {/* ── New message composer — project selection only here ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Send New Message</h3>
            <div className="space-y-3">
              {/* Project picker */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Project</label>
                <select value={selectedProject?.id || ''} onChange={e => setSelectedProject(projects.find(p=>p.id===parseInt(e.target.value))||null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose a project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {selectedProject && (
                <>
                  <div className="flex gap-3">
                    {['announcement','query'].map(t => (
                      <button key={t} onClick={() => setMsgForm(p=>({...p,type:t}))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${msgForm.type===t ? (t==='query'?'bg-amber-500 text-white border-amber-500':'bg-blue-600 text-white border-blue-600') : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        {t === 'query' ? '❓ Ask a Query' : '📢 Announcement'}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Send to</label>
                    <select value={msgForm.target_user_id} onChange={e => setMsgForm(p=>({...p,target_user_id:e.target.value}))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Entire team</option>
                      {members.map(m => <option key={m.user_id} value={m.user_id}>{m.employee?.first_name} {m.employee?.last_name}{m.tech_role?` — ${m.tech_role}`:''}</option>)}
                    </select>
                  </div>
                  <textarea rows={3} value={msgForm.message} onChange={e => setMsgForm(p=>({...p,message:e.target.value}))}
                    placeholder={msgForm.type==='query' ? 'Ask your team a question...' : 'Share an update, instruction or announcement...'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <Button loading={postMsgMutation.isPending} disabled={!msgForm.message.trim()} onClick={() => postMsgMutation.mutate()} className="w-full">
                    {msgForm.type==='query' ? 'Send Query' : 'Post Announcement'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── All existing threads across all projects ─────────── */}
          {(() => {
            const allThreads = projects.flatMap(p =>
              (p.messages || []).map(msg => ({
                ...msg,
                _projectId: p.id,
                _projectName: p.name,
              }))
            ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            if (allThreads.length === 0) {
              return (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  No messages yet. Post an announcement or ask a query above.
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm">All Conversations</h3>
                {allThreads.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} projectId={msg._projectId}
                    projectLabel={msg._projectName} currentUserId={user?.id} />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── UPDATES TAB (daily employee updates) ───────────────────── */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 max-w-sm">
            <label className="text-sm font-medium text-gray-700">Filter by Project</label>
            <select value={selectedProject?.id || ''} onChange={e => setSelectedProject(projects.find(p=>p.id===parseInt(e.target.value))||null)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {(selectedProject ? [selectedProject] : projects).map(project => (
            <div key={project.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">{project.name} — Daily Updates</h3>
              {(project.updates || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No updates yet from team members.</p>
              ) : (
                <div className="space-y-3">
                  {(project.updates || []).map(upd => (
                    <div key={upd.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
                      <Avatar name={`${upd.author?.first_name} ${upd.author?.last_name}`} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{upd.author?.first_name} {upd.author?.last_name}</span>
                          {upd.progress_pct != null && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{upd.progress_pct}% done</span>
                          )}
                          <span className="text-xs text-gray-400">{timeAgo(upd.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{upd.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add Member Modal ──────────────────────────────────────── */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member" size="sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Employee <span className="text-red-500">*</span></label>
            <select value={memberForm.user_id} onChange={e => setMemberForm(p=>({...p,user_id:e.target.value}))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select employee...</option>
              {(allEmployees||[]).filter(e => !teamUserIds.includes(e.id)).map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.work_email}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role / Designation</label>
            <select value={memberForm.tech_role} onChange={e => setMemberForm(p=>({...p,tech_role:e.target.value}))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select role...</option>
              {TECH_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Responsibilities</label>
            <textarea rows={3} value={memberForm.responsibilities} onChange={e => setMemberForm(p=>({...p,responsibilities:e.target.value}))}
              placeholder="What is this member responsible for? e.g. Build login module, Write unit tests, API integration..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Personal Deadline</label>
            <input type="date" value={memberForm.member_deadline} onChange={e => setMemberForm(p=>({...p,member_deadline:e.target.value}))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button>
            <Button loading={addMemberMutation.isPending} disabled={!memberForm.user_id} onClick={() => addMemberMutation.mutate()}>Add Member</Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Member Modal ─────────────────────────────────────── */}
      <Modal isOpen={!!editMember} onClose={() => setEditMember(null)} title="Edit Member Details" size="sm">
        {editMember && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Role / Designation</label>
              <select value={editMember.tech_role} onChange={e => setEditMember(p=>({...p,tech_role:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select role...</option>
                {TECH_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Responsibilities</label>
              <textarea rows={3} value={editMember.responsibilities} onChange={e => setEditMember(p=>({...p,responsibilities:e.target.value}))}
                placeholder="Update this member's responsibilities..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Personal Deadline</label>
              <input type="date" value={editMember.member_deadline} onChange={e => setEditMember(p=>({...p,member_deadline:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setEditMember(null)}>Cancel</Button>
              <Button loading={updateMemberMutation.isPending} onClick={() => updateMemberMutation.mutate()}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Project Modal ──────────────────────────────────── */}
      <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="Create Project" size="md">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
            <input value={projectForm.name} onChange={e => setProjectForm(p=>({...p,name:e.target.value}))}
              placeholder="e.g. E-Commerce App v2"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea rows={2} value={projectForm.description} onChange={e => setProjectForm(p=>({...p,description:e.target.value}))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select value={projectForm.status} onChange={e => setProjectForm(p=>({...p,status:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tech Stack</label>
              <input value={projectForm.tech_stack} onChange={e => setProjectForm(p=>({...p,tech_stack:e.target.value}))}
                placeholder="React, Node.js, MySQL"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" value={projectForm.start_date} onChange={e => setProjectForm(p=>({...p,start_date:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Deadline</label>
              <input type="date" value={projectForm.end_date} onChange={e => setProjectForm(p=>({...p,end_date:e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreateProject(false)}>Cancel</Button>
            <Button loading={createProjectMutation.isPending} disabled={!projectForm.name.trim()} onClick={() => createProjectMutation.mutate()}>Create Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
