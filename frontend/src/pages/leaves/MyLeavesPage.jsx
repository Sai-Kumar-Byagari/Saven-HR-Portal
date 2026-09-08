import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leavesApi } from '../../api/leaves.api';
import { queryClient } from '../../config/queryClient';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

export default function MyLeavesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState(null);

  const { data: balance } = useQuery({
    queryKey: ['leaves', 'my-balance'],
    queryFn: async () => { const r = await leavesApi.getMyBalance(); return r.data.data; },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaves', 'my', page],
    queryFn: async () => { const r = await leavesApi.getMy({ page, limit: 15 }); return r.data; },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => leavesApi.cancel(id),
    onSuccess: () => {
      toast.success('Leave cancelled.');
      setCancelId(null);
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const columns = [
    { key: 'leave_type', header: 'Type', render: (v) => v?.replace(/_/g, ' ') },
    { key: 'from_date', header: 'From', render: (v) => formatIndianDate(v) },
    { key: 'to_date', header: 'To', render: (v) => formatIndianDate(v) },
    { key: 'days', header: 'Days' },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'approver_comment', header: 'Comment',
      render: (v) => <span className="text-xs text-gray-500">{v || '—'}</span>,
    },
    {
      key: 'id', header: '',
      render: (_, row) => row.status === 'pending' ? (
        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setCancelId(row.id)}>
          Cancel
        </Button>
      ) : null,
    },
  ];

  const remaining = balance ? balance.total_leaves - parseFloat(balance.used_leaves) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leaves</h1>
          <p className="text-gray-500 text-sm mt-1">Track your leave applications and balance</p>
        </div>
        <Button onClick={() => navigate('/leaves/apply')}>Apply for Leave</Button>
      </div>

      {balance && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Leaves', value: balance.total_leaves, color: 'bg-blue-50 text-blue-700' },
            { label: 'Used', value: balance.used_leaves, color: 'bg-red-50 text-red-700' },
            { label: 'Remaining', value: remaining, color: 'bg-green-50 text-green-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} error={error} emptyMessage="No leave applications found." />
      </div>
      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => cancelMutation.mutate(cancelId)}
        loading={cancelMutation.isPending}
        title="Cancel Leave"
        message="Are you sure you want to cancel this leave request?"
        confirmLabel="Cancel Leave"
      />
    </div>
  );
}
