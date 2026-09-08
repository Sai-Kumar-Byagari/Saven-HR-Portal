import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { resignationApi } from '../../api/resignation.api';
import { queryClient } from '../../config/queryClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { formatIndianDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

const schema = z.object({
  last_working_day: z.string().min(1, 'Please select your last working day'),
  reason: z.string().min(10, 'Please provide a reason (min 10 chars)'),
  notice_period_acknowledgment: z.boolean().refine((v) => v === true, {
    message: 'You must acknowledge the notice period',
  }),
});

export default function ResignationFormPage() {
  const navigate = useNavigate();

  const { data: existing } = useQuery({
    queryKey: ['resignation', 'my'],
    queryFn: async () => { const r = await resignationApi.getMy(); return r.data.data; },
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: resignationApi.submit,
    onSuccess: (res) => {
      toast.success('Resignation submitted. We wish you well.');
      queryClient.invalidateQueries({ queryKey: ['resignation'] });
      const id = res.data.data.id;
      navigate(`/resignation/feedback/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit'),
  });

  // Show existing resignation
  if (existing) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Resignation</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Resignation Submitted</p>
            <StatusBadge status={existing.status} />
          </div>
          <p className="text-sm text-gray-600"><strong>Last Working Day:</strong> {formatIndianDate(existing.last_working_day)}</p>
          <p className="text-sm text-gray-600"><strong>Reason:</strong> {existing.reason}</p>
          {!existing.feedback && (
            <Button variant="outline" onClick={() => navigate(`/resignation/feedback/${existing.id}`)}>
              Submit Exit Feedback
            </Button>
          )}
          {existing.feedback && (
            <p className="text-sm text-green-600 font-medium">✓ Exit feedback submitted</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submit Resignation</h1>
        <p className="text-gray-500 text-sm mt-1">Please fill in your resignation details</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
        <p className="font-medium">Important:</p>
        <p className="mt-1">Once submitted, your resignation will be notified to your manager and HR. Please review your notice period requirements before proceeding.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <Input label="Last Working Day" type="date" error={errors.last_working_day?.message} required
            min={new Date().toISOString().split('T')[0]}
            {...register('last_working_day')} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Reason for Leaving <span className="text-red-500">*</span></label>
            <textarea rows={4} placeholder="Please share your reason for resignation..."
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.reason ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('reason')} />
            {errors.reason && <p className="text-xs text-red-600" role="alert">{errors.reason.message}</p>}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" {...register('notice_period_acknowledgment')}
              className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded" />
            <div>
              <p className="text-sm text-gray-700">I acknowledge that I am aware of and will fulfill my notice period obligations as per my employment contract.</p>
              {errors.notice_period_acknowledgment && (
                <p className="text-xs text-red-600 mt-0.5" role="alert">{errors.notice_period_acknowledgment.message}</p>
              )}
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button type="submit" variant="danger" loading={mutation.isPending}>Submit Resignation</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
