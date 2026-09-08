import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  work_email: z.string().email('Enter a valid work email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: ({ data }) => {
      const { accessToken, user } = data.data;
      setAuth(user, accessToken);
      if (user.isFirstLogin) {
        navigate('/first-login/set-password');
      } else if (user.employeeType === 'new' && !user.onboardingComplete) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      toast.error(msg);
    },
  });

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-400 text-sm mt-1">Sign in to your Saven HR Portal account</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
        <Input
          label="Work Email"
          type="email"
          placeholder="you@saven.tech"
          error={errors.work_email?.message}
          required
          autoComplete="username"
          {...register('work_email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          error={errors.password?.message}
          required
          autoComplete="current-password"
          {...register('password')}
        />

        <Button
          type="submit"
          loading={mutation.isPending}
          className="w-full"
          size="lg"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        {/* Disabled Microsoft SSO */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed bg-gray-50 text-sm"
          aria-label="Microsoft SSO coming soon"
        >
          <svg className="w-4 h-4" viewBox="0 0 21 21" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Continue with Microsoft (Coming Soon)
        </button>
      </form>

    </div>
  );
}
