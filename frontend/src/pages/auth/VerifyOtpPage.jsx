import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => authApi.verifyOtp({ personal_email: email, otp: data.otp }),
    onSuccess: () => {
      toast.success('OTP verified!');
      navigate('/reset-password', { state: { email } });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid OTP'),
  });

  if (!email) {
    navigate('/forgot-password');
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
        <p className="text-gray-500 mt-2">
          Enter the 6-digit OTP sent to <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
        <Input
          label="OTP Code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          error={errors.otp?.message}
          required
          {...register('otp', { required: 'OTP is required', minLength: { value: 6, message: 'OTP must be 6 digits' } })}
        />
        <Button type="submit" loading={mutation.isPending} className="w-full" size="lg">
          Verify OTP
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="text-blue-600 hover:underline">Resend OTP</Link>
      </p>
    </div>
  );
}
