import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { voiceApi } from '../../api/voice.api';
import { queryClient } from '../../config/queryClient';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  appreciation: 'bg-green-100 text-green-700',
  suggestion: 'bg-blue-100 text-blue-700',
  grievance: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
};

const TYPE_ICONS = { appreciation: '👏', suggestion: '💡', grievance: '⚠️', other: '📝' };

export default function VoiceInboxPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['voice', 'inbox', page, typeFilter],
    queryFn: async () => {
      const r = await voiceApi.getInbox({ page, limit: 15, type: typeFilter || undefined });
      return r.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => voiceApi.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['voice', 'inbox'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Voice Inbox</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination?.total || 0} submissions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'appreciation', 'suggestion', 'grievance', 'other'].map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t ? `${TYPE_ICONS[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}` : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {(data?.data || []).map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${TYPE_COLORS[v.type]}`}>
                    {TYPE_ICONS[v.type]} {v.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{v.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>
                        {v.is_anonymous
                          ? '🔒 Anonymous'
                          : `${v.user?.first_name || ''} ${v.user?.last_name || ''}`}
                      </span>
                      <span>·</span>
                      <span>{formatIndianDate(v.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={v.status} />
                  {v.status === 'open' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: v.id, status: 'acknowledged' })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Acknowledge
                    </button>
                  )}
                  {v.status === 'acknowledged' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: v.id, status: 'resolved' })}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.data?.length === 0 && (
            <div className="text-center py-16 text-gray-400">No submissions found</div>
          )}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPageChange={setPage} />
    </div>
  );
}
