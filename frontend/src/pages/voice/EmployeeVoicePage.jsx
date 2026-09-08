import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { voiceApi } from '../../api/voice.api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  type: z.enum(['appreciation', 'suggestion', 'grievance', 'other']),
  message: z.string().min(10, 'Please write at least 10 characters'),
  is_anonymous: z.boolean().optional(),
});

const TYPES = [
  { value: 'appreciation', label: '👏 Appreciation', desc: 'Recognise a colleague or team', color: 'border-green-300 bg-green-50' },
  { value: 'suggestion', label: '💡 Suggestion', desc: 'Share an idea for improvement', color: 'border-blue-300 bg-blue-50' },
  { value: 'grievance', label: '⚠️ Grievance', desc: 'Report an issue or concern', color: 'border-red-300 bg-red-50' },
  { value: 'other', label: '📝 Other', desc: 'General feedback or message', color: 'border-gray-300 bg-gray-50' },
];

export default function EmployeeVoicePage() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'suggestion', is_anonymous: false },
  });

  const selectedType = watch('type');

  const mutation = useMutation({
    mutationFn: voiceApi.submit,
    onSuccess: () => {
      toast.success('Your voice has been submitted!');
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit'),
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Voice</h1>
        <p className="text-gray-500 text-sm mt-1">
          Share your appreciation, suggestions, or concerns. Your voice matters.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5" noValidate>
          {/* Type selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Type <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((t) => (
                <label key={t.value}
                  className={`flex flex-col gap-0.5 border-2 rounded-xl p-3 cursor-pointer transition-all ${selectedType === t.value ? t.color + ' border-opacity-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <input type="radio" value={t.value} {...register('type')} className="sr-only" />
                  <span className="text-sm font-medium text-gray-800">{t.label}</span>
                  <span className="text-xs text-gray-500">{t.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Message <span className="text-red-500">*</span></label>
            <textarea
              rows={5}
              placeholder="Write your message here..."
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.message ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('message')}
            />
            {errors.message && <p className="text-xs text-red-600" role="alert">{errors.message.message}</p>}
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('is_anonymous')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            <div>
              <p className="text-sm font-medium text-gray-700">Submit anonymously</p>
              <p className="text-xs text-gray-400">Your name will not be visible to managers</p>
            </div>
          </label>

          <Button type="submit" loading={mutation.isPending} className="w-full" size="lg">
            Submit Voice
          </Button>
        </form>
      </div>
    </div>
  );
}
