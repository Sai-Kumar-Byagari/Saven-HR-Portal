import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users.api';
import { queryClient } from '../../config/queryClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  emp_id:               z.string().min(1, 'Employee ID is required'),
  first_name:           z.string().min(1, 'Required'),
  last_name:            z.string().min(1, 'Required'),
  work_email:           z.string().email('Valid work email required'),
  personal_email:       z.string().email('Valid personal email required').min(1, 'Personal email is required'),
  role:                 z.enum(['super_admin', 'manager', 'hr', 'employee', 'it', 'payroll']),
  employee_type:        z.enum(['new', 'existing']),
  doj:                  z.string().min(1, 'Date of Joining is required'),
  reporting_manager_id: z.string().optional(),
  temporary_password:   z.string().min(8, 'Minimum 8 characters'),
});

// Only 'employee' role requires a reporting manager
const SENIOR_ROLES = ['super_admin', 'manager', 'hr', 'payroll', 'it'];

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee', employee_type: 'new' },
  });

  const selectedRole = watch('role');
  const requiresManager = !SENIOR_ROLES.includes(selectedRole);

  // Fetch all users who can be managers (super_admin or manager role)
  const { data: managers } = useQuery({
    queryKey: ['users', 'potential-managers'],
    queryFn: async () => {
      const r = await usersApi.getAll({ limit: 200 });
      return (r.data.data || []).filter(u =>
        ['super_admin', 'manager'].includes(u.role) && u.is_active
      );
    },
  });

    const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        reporting_manager_id: data.reporting_manager_id && data.reporting_manager_id !== ''
          ? data.reporting_manager_id
          : null,
      };
      return usersApi.create(payload);
    },
    onSuccess: () => {
      toast.success('Employee created successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/employees');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create employee'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Add New Employee</h1>
        <p className="text-gray-400 text-sm mt-1">Fill in the details to register a new employee</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" error={errors.first_name?.message} required {...register('first_name')} />
            <Input label="Last Name"  error={errors.last_name?.message}  required {...register('last_name')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee ID" placeholder="e.g. SAV001"
              error={errors.emp_id?.message} required {...register('emp_id')} />
            <Input label="Work Email" type="email" placeholder="emp@saven.tech"
              error={errors.work_email?.message} required {...register('work_email')} />
          </div>

          <Input label="Personal Email" type="email" placeholder="personal@gmail.com"
            error={errors.personal_email?.message} required {...register('personal_email')} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('role')}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="it">IT</option>
                <option value="payroll">Payroll</option>
                {/* Only super_admin can create another super_admin */}
                {authUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Employee Type <span className="text-red-500">*</span></label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('employee_type')}>
                <option value="new">New (Onboarding required)</option>
                <option value="existing">Existing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Joining" type="date" error={errors.doj?.message} required {...register('doj')} />

            {/* Reporting Manager — only shown for employee/it roles */}
            {requiresManager ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Reporting Manager <span className="text-red-500">*</span>
                </label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('reporting_manager_id')}>
                  <option value="">-- Select Manager --</option>
                  {(managers || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Reporting Manager</label>
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400">
                  Not required for {selectedRole.replace('_', ' ')} role
                </div>
              </div>
            )}
          </div>

          <Input label="Temporary Password" type="password" placeholder="Min 8 characters"
            error={errors.temporary_password?.message} required {...register('temporary_password')} />

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
            The employee will be prompted to change this password on their first login.
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Create Employee</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
