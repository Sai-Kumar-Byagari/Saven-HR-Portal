import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const schema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  new_password: z.string().regex(PASSWORD_REGEX, 'Min 8 chars, 1 uppercase, 1 number, 1 special character'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data) => authApi.resetPassword({ personal_email: email, ...data }),
    onSuccess: () => {
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Reset failed'),
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Set new password</h2>
        <p className="text-gray-500 mt-2">Create a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
        <Input label="OTP Code" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
          error={errors.otp?.message} required {...register('otp')} />
        <Input label="New Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
          error={errors.new_password?.message} required {...register('new_password')} />
        <Input label="Confirm Password" type="password" placeholder="Repeat new password"
          error={errors.confirm_password?.message} required {...register('confirm_password')} />
        <Button type="submit" loading={mutation.isPending} className="w-full" size="lg">
          Reset Password
        </Button>
      </form>
    </div>
  );
}
