import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { normalizeError } from '../../utils/apiError';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  personal_email: z.string().email('Enter your registered personal email'),
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (_, vars) => {
      toast.success('OTP sent to your personal email.');
      navigate('/verify-otp', { state: { email: vars.personal_email } });
    },
    onError: (error) => toast.error(normalizeError(error).message || 'Failed to send OTP'),
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Forgot password?</h2>
        <p className="text-gray-500 mt-2">Enter your personal email to receive a reset OTP</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
        <Input
          label="Personal Email"
          type="email"
          placeholder="your.personal@gmail.com"
          error={errors.personal_email?.message}
          required
          {...register('personal_email')}
        />
        <Button type="submit" loading={mutation.isPending} className="w-full" size="lg">
          Send OTP
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">Sign in</Link>
      </p>
    </div>
  );
}
