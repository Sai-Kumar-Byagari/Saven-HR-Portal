import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { normalizeError } from '../../utils/apiError';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectUser, updateUser } from '../../store/slices/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const schema = z.object({
  new_password: z.string().regex(PASSWORD_REGEX, 'Min 8 chars, 1 uppercase, 1 number, 1 special character'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match', path: ['confirm_password'],
});

export default function FirstLoginSetPasswordPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data) => authService.setFirstLoginPassword({ new_password: data.new_password }),
    onSuccess: (data) => {
      dispatch(updateUser({
        isFirstLogin: false,
        employeeType: data.employeeType,
        onboardingComplete: data.onboardingComplete,
        personalEmail: data.personalEmail,
        empId: data.empId,
        doj: data.doj,
      }));
      toast.success('Password set! Welcome to Saven HR Portal.');
      if (data.employeeType === 'new' && !data.onboardingComplete) {
        navigate('/onboarding/forms'); // New employees fill joining forms first
      } else if (data.onboardingComplete) {
        navigate('/dashboard'); // Already onboarded — go straight to dashboard (e.g. after admin reset)
      } else {
        // Existing employees complete their profile
        navigate('/settings?setup=1');
      }
    },
    onError: (error) => toast.error(normalizeError(error).message || 'Failed to set password'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="font-semibold text-gray-900">Saven HR Portal</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set your password</h2>
        <p className="text-gray-500 text-sm mb-6">
          Welcome, <strong>{user?.firstName}</strong>! Please set a secure password to get started.
        </p>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <Input label="New Password" type="password" placeholder="Create a strong password"
            error={errors.new_password?.message} required {...register('new_password')} />
          <Input label="Confirm Password" type="password" placeholder="Repeat your password"
            error={errors.confirm_password?.message} required {...register('confirm_password')} />

          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.
          </div>

          <Button type="submit" loading={mutation.isPending} className="w-full" size="lg">
            Set Password & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
