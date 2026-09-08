import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../api/settings.api';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import { formatIndianDateTime } from '../../utils/dateHelpers';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [action, setAction] = useState('');
  const [tableName, setTableName] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, fromDate, toDate, action, tableName],
    queryFn: async () => {
      const r = await settingsApi.getAuditLogs({
        page, limit: 25,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        action: action || undefined,
        table_name: tableName || undefined,
      });
      return r.data;
    },
  });

  const columns = [
    {
      key: 'actor', header: 'User',
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium">{row.actor?.first_name} {row.actor?.last_name}</p>
          <p className="text-xs text-gray-400">{row.actor?.work_email}</p>
        </div>
      ),
    },
    { key: 'action', header: 'Action', render: (v) => (
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
          v === 'DELETE' ? 'bg-red-100 text-red-700' :
          v === 'CREATE' ? 'bg-green-100 text-green-700' :
          v === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>{v}</span>
      ),
    },
    { key: 'table_name', header: 'Table', render: (v) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v}</code> },
    { key: 'record_id', header: 'Record ID', render: (v) => v || '—' },
    { key: 'ip_address', header: 'IP', render: (v) => <span className="text-xs text-gray-400">{v || '—'}</span> },
    { key: 'created_at', header: 'Time', render: (v) => <span className="text-xs">{formatIndianDateTime(v)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Complete audit trail of all system actions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="From date" />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="To date" />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-gray-600">Action</label>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by action">
            <option value="">All Actions</option>
            {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','UPLOAD'].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-gray-600">Table</label>
          <select value={tableName} onChange={(e) => { setTableName(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by table">
            <option value="">All Tables</option>
            {['users','leaves','payroll','policies','job_positions','candidates'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} error={error} emptyMessage="No audit logs found." />
      </div>
      <Pagination pagination={data?.pagination} onPageChange={setPage} />
    </div>
  );
}
