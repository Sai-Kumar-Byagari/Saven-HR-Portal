import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users.api';
import { queryClient } from '../../config/queryClient';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge, { StatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ROLE_LABELS } from '../../config/roles';
import { formatIndianDate } from '../../utils/dateHelpers';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const role = useAuthStore((s) => s.user?.role);
  const canDelete = ['super_admin', 'hr'].includes(role);

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'all', page, search],
    queryFn: async () => {
      const r = await usersApi.getAll({ page, limit: 20, search });
      return r.data;
    },
    keepPreviousData: true,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersApi.deactivate(id),
    onSuccess: () => {
      toast.success('Employee deactivated.');
      setConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.permanentDelete(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Employee permanently deleted.');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const columns = [
    {
      key: 'first_name',
      header: 'Employee',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.first_name} ${row.last_name}`} role={row.role} photo={row.profile_photo} size="sm" />
          <div>
            <p className="font-medium text-gray-900 text-sm">{row.first_name} {row.last_name}</p>
            <p className="text-xs text-gray-400">{row.work_email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (v) => <Badge variant="blue">{ROLE_LABELS[v] || v}</Badge> },
    { key: 'doj', header: 'Joined', render: (v) => formatIndianDate(v) },
    {
      key: 'is_active',
      header: 'Status',
      render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} />,
    },
    {
      key: 'id',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${row.id}`)}>View</Button>
          {row.is_active && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setConfirmId(row.id)}>
              Deactivate
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteId(row.id)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all employees in your organization</p>
        </div>
        <Button onClick={() => navigate('/employees/add')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/></svg>
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
          aria-label="Search employees"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} error={error} emptyMessage="No employees found." />
      </div>

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => deactivateMutation.mutate(confirmId)}
        loading={deactivateMutation.isPending}
        title="Deactivate Employee"
        message="Are you sure you want to deactivate this employee? They will lose access to the portal."
        confirmLabel="Deactivate"
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Permanently Delete Employee"
        message="Do you want to delete permanently? This will remove ALL data of this employee from the system — attendance, leaves, payroll, documents, and everything else. This action CANNOT be undone."
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}
