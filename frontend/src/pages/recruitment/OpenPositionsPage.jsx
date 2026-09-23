import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../../api/recruitment.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { formatIndianDate } from '../../utils/dateHelpers';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

function downloadJD(position) {
  const jd = position.descriptions?.[0];
  if (!jd?.content) return toast.error('No JD content available');

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxW = pageW - margin * 2;
  let y = 20;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(position.title, margin, y);
  y += 10;

  // Meta info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Department: ${position.department}`, margin, y); y += 6;
  if (position.salary_lpa) { doc.text(`Salary: ${position.salary_lpa} LPA`, margin, y); y += 6; }
  if (position.experience_years) { doc.text(`Experience: ${position.experience_years} years`, margin, y); y += 6; }
  if (position.deadline) { doc.text(`Deadline: ${position.deadline}`, margin, y); y += 6; }
  y += 4;

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // JD Content
  doc.setTextColor(40);
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(jd.content, maxW);
  for (const line of lines) {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  }

  const filename = `${position.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}_JD.pdf`;
  doc.save(filename);
}

export default function OpenPositionsPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const role = user?.role;
  const canCreate = ['super_admin', 'hr'].includes(role);

  const [closeId, setCloseId] = useState(null);
  const [closeName, setCloseName] = useState('');
  const [viewJD, setViewJD] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['positions', 'all-visible'],
    queryFn: async () => {
      const r = await recruitmentApi.getPositions({ limit: 100 });
      return r.data;
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id) => recruitmentApi.closePosition(id),
    onSuccess: () => {
      toast.success('Position closed.');
      setCloseId(null);
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to close'),
  });

  const positions = data?.data || [];

  const visible = role === 'manager'
    ? positions.filter(p => p.assigned_manager_id === user?.id || p.assignedManager?.id === user?.id || true)
    : positions;

  const statusColor = {
    open:             'bg-green-100 text-green-700 border-green-200',
    pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    draft:            'bg-gray-100 text-gray-600 border-gray-200',
    closed:           'bg-red-100 text-red-600 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Open Positions</h1>
          <p className="text-gray-400 text-sm mt-1">
            {visible.filter(p => p.status === 'open').length} open ·{' '}
            {visible.filter(p => p.status === 'pending_approval').length} pending approval
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/recruitment/create')}>
            + Create Position
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No positions yet</p>
          {canCreate && <p className="text-sm mt-1">Create a position to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((pos) => {
            const jd = pos.descriptions?.[0];
            return (
              <div key={pos.id}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${pos.status === 'closed' ? 'opacity-60' : 'border-gray-200'}`}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{pos.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{pos.department}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${statusColor[pos.status] || statusColor.draft}`}>
                    {pos.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Key info */}
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {pos.salary_lpa && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">💰</span>
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none">Salary</p>
                        <p className="text-sm font-semibold text-gray-800">{pos.salary_lpa} LPA</p>
                      </div>
                    </div>
                  )}
                  {pos.experience_years && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🎯</span>
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none">Experience</p>
                        <p className="text-sm font-semibold text-gray-800">{pos.experience_years} yrs</p>
                      </div>
                    </div>
                  )}
                  {pos.deadline && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⏰</span>
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none">Deadline</p>
                        <p className={`text-sm font-semibold ${new Date(pos.deadline) < new Date() ? 'text-red-500' : 'text-orange-600'}`}>
                          {formatIndianDate(pos.deadline)}
                        </p>
                      </div>
                    </div>
                  )}
                  {pos.min_score && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📊</span>
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none">Min Score</p>
                        <p className="text-sm font-semibold text-gray-800">{pos.min_score}/100</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Secondary meta */}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                  {pos.assignedManager && <span>Manager: {pos.assignedManager.first_name} {pos.assignedManager.last_name}</span>}
                  <span>Posted: {formatIndianDate(pos.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {/* View & Download JD — available for ALL roles when JD exists */}
                  {jd?.content && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setViewJD(pos)}>
                        📄 View JD
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadJD(pos)}>
                        ⬇ Download JD
                      </Button>
                    </>
                  )}

                  {/* View candidates */}
                  {['super_admin', 'hr', 'manager'].includes(role) && pos.status !== 'draft' && (
                    <Button size="sm" variant="outline"
                      onClick={() => navigate(`/recruitment/${pos.id}/candidates`)}>
                      Candidates
                    </Button>
                  )}

                  {/* Review JD */}
                  {['super_admin', 'manager'].includes(role) && pos.status === 'pending_approval' && (
                    <Button size="sm"
                      onClick={() => navigate(`/recruitment/jd-approval/${pos.id}`)}>
                      Review JD
                    </Button>
                  )}

                  {/* Close position — admin, HR, or assigned manager only */}
                  {pos.status !== 'closed' && pos.status !== 'draft' && (
                    ['super_admin', 'hr'].includes(role) || (role === 'manager' && (pos.assigned_manager_id === user?.id || pos.assignedManager?.id === user?.id))
                  ) && (
                    <Button size="sm" variant="danger"
                      onClick={() => { setCloseId(pos.id); setCloseName(pos.title); }}>
                      Close
                    </Button>
                  )}

                  {pos.status === 'closed' && (
                    <span className="text-xs text-red-500 font-medium">Position Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── View JD Modal ─────────────────────────────────────────── */}
      <Modal isOpen={!!viewJD} onClose={() => setViewJD(null)}
        title={viewJD?.title || 'Job Description'} size="lg">
        {viewJD && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Department</p>
                <p className="font-medium text-gray-800 mt-0.5">{viewJD.department}</p>
              </div>
              {viewJD.salary_lpa && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Salary</p>
                  <p className="font-semibold text-green-700 mt-0.5">{viewJD.salary_lpa} LPA</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Job Description</span>
              <button onClick={() => downloadJD(viewJD)}
                className="text-xs text-blue-600 border border-blue-300 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium">
                ⬇ Download
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[400px] overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {viewJD.descriptions?.[0]?.content}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setViewJD(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!closeId}
        onClose={() => setCloseId(null)}
        onConfirm={() => closeMutation.mutate(closeId)}
        loading={closeMutation.isPending}
        title="Close Position"
        message={`Are you sure you want to close "${closeName}"? This position will no longer appear as open and candidates won't be able to be added.`}
        confirmLabel="Close Position"
        variant="danger"
      />
    </div>
  );
}
