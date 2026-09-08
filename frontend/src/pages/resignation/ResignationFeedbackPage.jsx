import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { resignationApi } from '../../api/resignation.api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  rating: z.string().min(1, 'Please rate your experience'),
  feedback_text: z.string().min(10, 'Please provide feedback (min 10 chars)'),
  reason_for_leaving: z.string().min(3, 'Required'),
  suggestions: z.string().optional(),
  would_rejoin: z.string().optional(),
});

const RATINGS = [
  { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
  { value: '4', label: '⭐⭐⭐⭐ Good' },
  { value: '3', label: '⭐⭐⭐ Average' },
  { value: '2', label: '⭐⭐ Below Average' },
  { value: '1', label: '⭐ Poor' },
];

export default function ResignationFeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data) => resignationApi.submitExitFeedback(id, {
      ...data,
      rating: parseInt(data.rating),
      would_rejoin: data.would_rejoin === 'yes',
    }),
    onSuccess: () => {
      toast.success('Exit feedback submitted. Thank you for your time at Saven!');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit feedback'),
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exit Feedback</h1>
        <p className="text-gray-500 text-sm mt-1">Help us improve by sharing your experience</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Overall Experience <span className="text-red-500">*</span></label>
            <select className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.rating ? 'border-red-400' : 'border-gray-300'}`}
              {...register('rating')}>
              <option value="">Select rating...</option>
              {RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {errors.rating && <p className="text-xs text-red-600">{errors.rating.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Primary Reason for Leaving <span className="text-red-500">*</span></label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('reason_for_leaving')}>
              <option value="">Select reason...</option>
              {['Better opportunity', 'Higher salary', 'Work-life balance', 'Relocation', 'Personal reasons', 'Career change', 'Education', 'Other'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.reason_for_leaving && <p className="text-xs text-red-600">{errors.reason_for_leaving.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Feedback / Comments <span className="text-red-500">*</span></label>
            <textarea rows={4} placeholder="Share your experience working at Saven Technologies..."
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.feedback_text ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('feedback_text')} />
            {errors.feedback_text && <p className="text-xs text-red-600">{errors.feedback_text.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Suggestions for Improvement</label>
            <textarea rows={2} placeholder="Any suggestions for the company..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              {...register('suggestions')} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Would you consider rejoining Saven?</label>
            <div className="flex gap-4">
              {['yes', 'no'].map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={v} {...register('would_rejoin')}
                    className="w-4 h-4 text-blue-600 border-gray-300" />
                  <span className="text-sm text-gray-700 capitalize">{v}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Skip for now</Button>
            <Button type="submit" loading={mutation.isPending}>Submit Feedback</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
