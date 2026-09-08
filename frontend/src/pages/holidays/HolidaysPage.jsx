import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { holidaysApi } from '../../api/holidays.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatIndianDate } from '../../utils/dateHelpers';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function HolidaysPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = ['super_admin', 'hr'].includes(role);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => { const r = await holidaysApi.getAll(); return r.data.data; },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: holidaysApi.create,
    onSuccess: () => {
      toast.success('Holiday added.');
      reset();
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => holidaysApi.delete(id),
    onSuccess: () => {
      toast.success('Holiday deleted.');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const typeColor = { national: 'red', festival: 'orange', optional: 'gray' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">{canManage ? 'Manage official holidays for the financial year' : 'View official holidays for the financial year'}</p>
        </div>
        {canManage && <Button onClick={() => setShowAdd(true)}>Add Holiday</Button>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data || []).map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{h.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{formatIndianDate(h.date)}</p>
                <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium
                  ${h.type === 'national' ? 'bg-red-100 text-red-700' : h.type === 'festival' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                  {h.type}
                </span>
              </div>
              {canManage && (
                <button onClick={() => setDeleteId(h.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  aria-label={`Delete ${h.name}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="3 6 5 6 21 6" strokeWidth="2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeWidth="2"/><path d="M10 11v6M14 11v6" strokeWidth="2"/></svg>
                </button>
              )}
            </div>
          ))}
          {data?.length === 0 && <p className="text-gray-400 col-span-3 text-center py-10">No holidays added yet</p>}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); reset(); }} title="Add Holiday" size="sm">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4" noValidate>
          <Input label="Holiday Name" error={errors.name?.message} required {...register('name', { required: 'Required' })} />
          <Input label="Date" type="date" error={errors.date?.message} required {...register('date', { required: 'Required' })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('type')}>
              <option value="festival">Festival</option>
              <option value="national">National</option>
              <option value="optional">Optional</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Add Holiday</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}
        title="Delete Holiday" message="Are you sure you want to delete this holiday?" confirmLabel="Delete" />
    </div>
  );
}
