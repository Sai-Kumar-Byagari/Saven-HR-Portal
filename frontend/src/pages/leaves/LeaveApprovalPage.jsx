import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { leavesApi } from '../../api/leaves.api';
import { queryClient } from '../../config/queryClient';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

export default function LeaveApprovalPage() {
  const [actionModal, setActionModal] = useState(null); // { leave, action }
  const [comment, setComment] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaves', 'pending'],
    queryFn: async () => { const r = await leavesApi.getPending({ limit: 50 }); return r.data; },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, comment }) => leavesApi.action(id, { action, comment }),
    onSuccess: (_, vars) => {
      toast.success(`Leave ${vars.action === 'approve' ? 'approved' : 'rejected'}.`);
      setActionModal(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  const columns = [
    {
      key: 'user', header: 'Employee',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Avatar name={`${row.user?.first_name} ${row.user?.last_name}`} role={row.user?.role} size="sm" />
          <div>
            <p className="text-sm font-medium">{row.user?.first_name} {row.user?.last_name}</p>
            <p className="text-xs text-gray-400">{row.user?.role}</p>
          </div>
        </div>
      ),
    },
    { key: 'leave_type', header: 'Type', render: (v) => v?.replace(/_/g, ' ') },
    { key: 'from_date', header: 'From', render: (v) => formatIndianDate(v) },
    { key: 'to_date', header: 'To', render: (v) => formatIndianDate(v) },
    { key: 'days', header: 'Days' },
    { key: 'reason', header: 'Reason', render: (v) => <span className="text-xs text-gray-600 line-clamp-1">{v}</span> },
    {
      key: 'id', header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setActionModal({ leave: row, action: 'approve' })}>
            Approve
          </Button>
          <Button size="sm" variant="danger"
            onClick={() => setActionModal({ leave: row, action: 'reject' })}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">
          {data?.pagination?.total || 0} pending request{data?.pagination?.total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} error={error} emptyMessage="No pending leave requests." />
      </div>

      {/* Action modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setComment(''); }}
        title={actionModal?.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
        size="sm"
      >
        {actionModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p><strong>{actionModal.leave.user?.first_name} {actionModal.leave.user?.last_name}</strong></p>
              <p className="text-gray-500">{actionModal.leave.leave_type?.replace(/_/g, ' ')} · {actionModal.leave.days} day(s)</p>
              <p className="text-gray-500">{formatIndianDate(actionModal.leave.from_date)} – {formatIndianDate(actionModal.leave.to_date)}</p>
              <p className="mt-1 text-gray-600">Reason: {actionModal.leave.reason}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Comment {actionModal.action === 'reject' ? '(required)' : '(optional)'}</label>
              <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setActionModal(null); setComment(''); }}>Cancel</Button>
              <Button
                variant={actionModal.action === 'approve' ? 'primary' : 'danger'}
                loading={actionMutation.isPending}
                onClick={() => actionMutation.mutate({ id: actionModal.leave.id, action: actionModal.action, comment })}
              >
                {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
