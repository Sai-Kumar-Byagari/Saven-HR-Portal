import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leavesApi } from '../../api/leaves.api';
import { queryClient } from '../../config/queryClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  leave_type: z.enum(['casual_leave', 'sick_leave', 'earned_leave', 'maternity_paternity', 'compensatory_off', 'unpaid_leave', 'work_from_home']),
  from_date: z.string().min(1, 'Required'),
  to_date: z.string().min(1, 'Required'),
  reason: z.string().min(5, 'Please provide a reason (min 5 chars)'),
}).refine((d) => new Date(d.to_date) >= new Date(d.from_date), {
  message: 'End date must be after start date',
  path: ['to_date'],
});

const LEAVE_TYPES = [
  { value: 'casual_leave', label: 'Casual Leave' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'earned_leave', label: 'Earned Leave' },
  { value: 'maternity_paternity', label: 'Maternity / Paternity' },
  { value: 'compensatory_off', label: 'Compensatory Off' },
  { value: 'unpaid_leave', label: 'Unpaid Leave' },
  { value: 'work_from_home', label: 'Work From Home' },
];

export default function ApplyLeavePage() {
  const navigate = useNavigate();

  const { data: balance } = useQuery({
    queryKey: ['leaves', 'my-balance'],
    queryFn: async () => { const r = await leavesApi.getMyBalance(); return r.data.data; },
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { leave_type: 'casual_leave' },
  });

  const selectedLeaveType = watch('leave_type');

  const mutation = useMutation({
    mutationFn: leavesApi.apply,
    onSuccess: () => {
      toast.success('Leave application submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      navigate('/leaves/my');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to apply for leave'),
  });

  const remaining = balance ? balance.total_leaves - parseFloat(balance.used_leaves) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
        <p className="text-gray-500 text-sm mt-1">Submit a leave request to your manager</p>
      </div>

      {balance && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between text-sm">
          <span className="text-blue-700">Leave Balance (FY {balance.financial_year})</span>
          <span className="font-bold text-blue-800">{remaining} / {balance.total_leaves} days remaining</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Leave Type <span className="text-red-500">*</span></label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('leave_type')}>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.leave_type && <p className="text-xs text-red-600">{errors.leave_type.message}</p>}
            {selectedLeaveType === 'work_from_home' && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Work From Home will not deduct from your leave balance.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" error={errors.from_date?.message} required {...register('from_date')} />
            <Input label="To Date" type="date" error={errors.to_date?.message} required {...register('to_date')} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              placeholder="Briefly describe the reason..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              {...register('reason')}
            />
            {errors.reason && <p className="text-xs text-red-600">{errors.reason.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/leaves/my')}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
