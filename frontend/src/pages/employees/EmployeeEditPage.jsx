import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { usersApi } from '../../api/users.api';
import { queryClient } from '../../config/queryClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = useAppSelector(selectUser);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => { const r = await usersApi.getById(id); return r.data.data; },
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    values: employee ? {
      first_name: employee.first_name,
      last_name: employee.last_name,
      personal_email: employee.personal_email || '',
      role: employee.role,
      office_location: employee.office_location,
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (data) => usersApi.update(id, data),
    onSuccess: () => {
      toast.success('Employee updated!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate(`/employees/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Edit Employee</h1>
        <p className="text-sm text-gray-400 mt-0.5">{employee?.first_name} {employee?.last_name}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" {...register('first_name', { required: 'Required' })} error={errors.first_name?.message} />
            <Input label="Last Name" {...register('last_name', { required: 'Required' })} error={errors.last_name?.message} />
          </div>
          <Input label="Personal Email" type="email" {...register('personal_email')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('role')}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="payroll">Payroll</option>
              {/* Only super_admin can assign the super_admin role */}
              {authUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(`/employees/${id}`)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
