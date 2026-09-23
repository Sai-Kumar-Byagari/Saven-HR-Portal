import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usersApi } from '../../api/users.api';
import { documentsApi } from '../../api/documents.api';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import { ROLE_LABELS, ROLE_COLORS } from '../../config/roles';
import { formatIndianDate } from '../../utils/dateHelpers';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

import { getFileUrl } from '../../utils/fileUrl';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const resetPasswordSchema = z.object({
  new_password: z.string().regex(PASSWORD_REGEX, 'Min 8 chars, 1 uppercase, 1 number, 1 special character'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match', path: ['confirm_password'],
});

const BASE_DETAIL_TABS = ['Overview', 'Personal Info', 'Bank Details', 'Documents'];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = useAppSelector(selectUser);
  const [activeTab, setActiveTab] = useState('Overview');

  // Only admin/HR can see the Reset Password tab
  const canResetPassword = ['super_admin', 'hr'].includes(authUser?.role);
  const TABS = canResetPassword ? [...BASE_DETAIL_TABS, 'Reset Password'] : BASE_DETAIL_TABS;

  // Reset password form
  const { register: regReset, handleSubmit: handleReset, reset: resetForm, formState: { errors: resetErrors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data) => usersApi.resetPassword(id, { new_password: data.new_password }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Password reset successfully!');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reset password'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => { const r = await usersApi.getById(id); return r.data.data; },
  });

  const { data: docsData, isLoading: loadingDocs } = useQuery({
    queryKey: ['documents', 'employee', id],
    queryFn: async () => { const r = await documentsApi.getEmployee(id); return r.data.data; },
    enabled: activeTab === 'Documents',
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error || !data) return <div className="text-center py-20 text-red-500">Employee not found.</div>;

  const fullName = `${data.first_name} ${data.last_name}`;
  const canEdit = ['super_admin', 'hr'].includes(authUser?.role);

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 shadow-card">
        <Avatar name={fullName} role={data.role} photo={data.profile_photo} size="xl" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-500">{data.work_email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[data.role]}`}>
              {ROLE_LABELS[data.role]}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${data.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {data.is_active ? 'Active' : 'Inactive'}
            </span>
            {data.onboarding_complete === false && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                Onboarding Pending
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => navigate(`/employees/${id}/edit`)}>
            Edit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ───────────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Employment Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <InfoRow label="Work Email"       value={data.work_email} />
            <InfoRow label="Personal Email"   value={data.personal_email} />
            <InfoRow label="Date of Joining"  value={formatIndianDate(data.doj)} />
            <InfoRow label="Office Location"  value={data.office_location} />
            <InfoRow label="Employee Type"    value={data.employee_type} />
            <InfoRow label="Reporting Manager"
              value={data.reportingManager ? `${data.reportingManager.first_name} ${data.reportingManager.last_name}` : null} />
          </div>
        </div>
      )}

      {/* ── Personal Info ───────────────────────────────────────────── */}
      {activeTab === 'Personal Info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Personal Information</h2>
          {!data.profile ? (
            <p className="text-sm text-gray-400 py-6 text-center">No personal info submitted yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <InfoRow label="Gender"             value={data.profile.gender} />
              <InfoRow label="Date of Birth"      value={formatIndianDate(data.profile.dob)} />
              <InfoRow label="Blood Group"        value={data.profile.blood_group} />
              <InfoRow label="Phone"              value={data.profile.phone} />
              <InfoRow label="Emergency Contact"  value={data.profile.emergency_contact} />
              <InfoRow label="Emergency Contact Name" value={data.profile.emergency_contact_name} />
              <div className="col-span-2 md:col-span-3">
                <InfoRow label="Address" value={data.profile.address} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bank Details ────────────────────────────────────────────── */}
      {activeTab === 'Bank Details' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Bank Details</h2>
          {!data.profile?.account_number ? (
            <p className="text-sm text-gray-400 py-6 text-center">Bank details not submitted yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <InfoRow label="Bank Name"      value={data.profile.bank_name} />
              <InfoRow label="Account Number" value={data.profile.account_number} />
              <InfoRow label="IFSC Code"      value={data.profile.ifsc_code} />
              <InfoRow label="Branch Name"    value={data.profile.branch_name} />
            </div>
          )}
        </div>
      )}

      {/* ── Documents ───────────────────────────────────────────────── */}
      {activeTab === 'Documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Documents</h2>
          {loadingDocs ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !docsData?.length ? (
            <p className="text-sm text-gray-400 py-8 text-center">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {docsData.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{doc.display_name}</p>
                      <p className="text-xs text-gray-400">
                        {doc.display_name}{doc.original_name.substring(doc.original_name.lastIndexOf('.'))} · {formatIndianDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getFileUrl(doc.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-medium px-3 py-1.5 bg-blue-50 rounded-lg"
                  >
                    View / Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reset Password (Admin/HR only) ────────────────────────── */}
      {activeTab === 'Reset Password' && canResetPassword && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-800">Reset Password</h2>
            <p className="text-sm text-gray-400 mt-1">
              Set a new temporary password for <strong>{fullName}</strong>. They will be required to set their own password on next login.
            </p>
          </div>

          <form onSubmit={handleReset((d) => resetPasswordMutation.mutate(d))} className="space-y-4 max-w-md" noValidate>
            <Input
              label="New Password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
              error={resetErrors.new_password?.message}
              required
              {...regReset('new_password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat the password"
              error={resetErrors.confirm_password?.message}
              required
              {...regReset('confirm_password')}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <strong>Note:</strong> After resetting, the employee will be forced to set a new password when they log in next.
            </div>

            <Button type="submit" loading={resetPasswordMutation.isPending}>
              Reset Password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
