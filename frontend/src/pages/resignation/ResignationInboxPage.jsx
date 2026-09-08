import { useQuery, useMutation } from '@tanstack/react-query';
import { resignationApi } from '../../api/resignation.api';
import { queryClient } from '../../config/queryClient';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

export default function ResignationInboxPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['resignation', 'inbox'],
    queryFn: async () => { const r = await resignationApi.getInbox(); return r.data; },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => resignationApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['resignation', 'inbox'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resignation Inbox</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination?.total || 0} resignation(s)</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (data?.data || []).length === 0 ? (
        <div className="text-center py-16 text-gray-400">No resignation submissions</div>
      ) : (
        <div className="space-y-4">
          {(data?.data || []).map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {r.employee?.first_name} {r.employee?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{r.employee?.work_email} · {r.employee?.role}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-gray-400">Joined: </span>{formatIndianDate(r.employee?.doj)}</p>
                    <p><span className="text-gray-400">Last Day: </span><span className="font-medium text-red-600">{formatIndianDate(r.last_working_day)}</span></p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{r.reason}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                {r.status === 'submitted' && (
                  <>
                    <Button size="sm" onClick={() => statusMutation.mutate({ id: r.id, status: 'acknowledged' })}
                      loading={statusMutation.isPending}>
                      Acknowledge
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: r.id, status: 'accepted' })}>
                      Accept
                    </Button>
                  </>
                )}
                {r.status === 'acknowledged' && (
                  <Button size="sm" onClick={() => statusMutation.mutate({ id: r.id, status: 'accepted' })}>
                    Accept
                  </Button>
                )}
                {r.feedback && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Exit feedback submitted</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
