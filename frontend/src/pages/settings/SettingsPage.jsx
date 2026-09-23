import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { profileApi } from '../../api/profile.api';
import { documentsApi } from '../../api/documents.api';
import { onboardingApi } from '../../api/onboarding.api';
import { queryClient } from '../../config/queryClient';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectUser, updateUser } from '../../store/slices/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatIndianDate } from '../../utils/dateHelpers';
import { getFileUrl } from '../../utils/fileUrl';
import toast from 'react-hot-toast';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const newPasswordSchema = z.object({
  new_password: z.string().regex(PASSWORD_REGEX, 'Min 8 chars, 1 uppercase, 1 number, 1 special character'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match', path: ['confirm_password'],
});

const DOC_TYPES = [
  { key: 'ssc',         label: 'SSC Memo' },
  { key: '12th',        label: '12th Memo' },
  { key: 'degree',      label: 'Degree Certificate' },
  { key: 'aadhar',      label: 'Aadhaar Card' },
  { key: 'pan',         label: 'PAN Card' },
  { key: 'resume',      label: 'Resume' },
  { key: 'offer_letter',label: 'Offer Letter' },
];

const BASE_TABS = ['Personal Info', 'Bank Details', 'Documents'];

export default function SettingsPage() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Personal Info');
  const [uploading, setUploading] = useState({});

  // Only admin and HR see the Change Password tab
  const TABS = ['super_admin', 'hr'].includes(user?.role)
    ? [...BASE_TABS, 'Change Password']
    : BASE_TABS;

  // Setup mode — came from first login or form submission
  const isSetupMode = new URLSearchParams(location.search).get('setup') === '1';

  const completeMutation = useMutation({
    mutationFn: onboardingApi.complete,
    onSuccess: () => {
      dispatch(updateUser({ onboardingComplete: true }));
      toast.success('Profile complete! Welcome to Saven HR Portal 🎉');
      navigate('/dashboard');
    },
    onError: () => navigate('/dashboard'), // allow through even if fails
  });

  /* ── Fetch profile ───────────────────────────────── */
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const r = await profileApi.get(); return r.data.data; },
  });

  /* ── Fetch my documents ──────────────────────────── */
  const { data: docsData } = useQuery({
    queryKey: ['documents', 'my'],
    queryFn: async () => { const r = await documentsApi.getMy(); return r.data.data; },
  });

  const uploadedKeys = (docsData || []).reduce((acc, d) => { acc[d.doc_type] = d; return acc; }, {});

  /* ── Personal info form ──────────────────────────── */
  const personalForm = useForm({
    values: {
      gender:                 profile?.profile?.gender || '',
      dob:                    profile?.profile?.dob || '',
      blood_group:            profile?.profile?.blood_group || '',
      phone:                  profile?.profile?.phone || '',
      emergency_contact:      profile?.profile?.emergency_contact || '',
      emergency_contact_name: profile?.profile?.emergency_contact_name || '',
      address:                profile?.profile?.address || '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data) => profileApi.update(data),
    onSuccess: () => { toast.success('Personal info saved!'); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  /* ── Bank details form ───────────────────────────── */
  const bankForm = useForm({
    values: {
      account_number: profile?.profile?.account_number || '',
      ifsc_code:      profile?.profile?.ifsc_code || '',
      bank_name:      profile?.profile?.bank_name || '',
      branch_name:    profile?.profile?.branch_name || '',
    },
  });

  const bankMutation = useMutation({
    mutationFn: (data) => profileApi.updateBankDetails(data),
    onSuccess: () => { toast.success('Bank details saved!'); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  /* ── Password change (multi-step OTP flow) ────── */
  const [pwdStep, setPwdStep] = useState(1); // 1=email, 2=otp, 3=new-password
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdOtp, setPwdOtp] = useState('');

  const sendOtpMutation = useMutation({
    mutationFn: (data) => profileApi.requestPasswordOtp(data),
    onSuccess: () => { toast.success('OTP sent to your personal email!'); setPwdStep(2); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to send OTP'),
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm({
    resolver: zodResolver(newPasswordSchema),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => profileApi.changePassword({ personal_email: pwdEmail, otp: pwdOtp, new_password: data.new_password }),
    onSuccess: () => { toast.success('Password changed!'); resetPwd(); setPwdStep(1); setPwdEmail(''); setPwdOtp(''); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to change password'),
  });

  /* ── Photo upload ────────────────────────────────── */
  const photoMutation = useMutation({
    mutationFn: (file) => { const fd = new FormData(); fd.append('photo', file); return profileApi.uploadPhoto(fd); },
    onSuccess: (res) => { dispatch(updateUser({ profilePhoto: res.data.data.profile_photo })); toast.success('Photo updated!'); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => toast.error('Failed to upload photo'),
  });

  /* ── Document upload ─────────────────────────────── */
  async function handleDocUpload(docType, file) {
    setUploading((p) => ({ ...p, [docType]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);
      await documentsApi.upload(fd);
      toast.success(`${DOC_TYPES.find(d => d.key === docType)?.label} uploaded!`);
      queryClient.invalidateQueries({ queryKey: ['documents', 'my'] });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading((p) => ({ ...p, [docType]: false }));
    }
  }

  async function handleDocDelete(id) {
    try {
      await documentsApi.delete(id);
      toast.success('Document removed.');
      queryClient.invalidateQueries({ queryKey: ['documents', 'my'] });
    } catch {
      toast.error('Failed to remove document');
    }
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || window.location.origin;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your personal information, bank details and documents</p>
      </div>

      {/* Setup mode banner — shown when coming from first login */}
      {isSetupMode && (
        <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="text-white font-semibold text-sm">Complete your profile to get started</p>
            <p className="text-blue-200 text-xs mt-0.5">Fill in your personal details, bank info, and upload documents. You can also do this later from Settings.</p>
          </div>
          <button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="shrink-0 bg-white text-blue-600 hover:bg-blue-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-70 whitespace-nowrap"
          >
            {completeMutation.isPending ? 'Saving...' : 'Done → Go to Dashboard'}
          </button>
        </div>
      )}

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 shadow-card">
        <div className="relative">
          <Avatar name={user ? `${user.firstName} ${user.lastName}` : ''} role={user?.role} photo={user?.profilePhoto} size="xl" />
          <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md"
            aria-label="Change profile photo">
            <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) photoMutation.mutate(e.target.files[0]); }} />
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" strokeWidth={2} />
            </svg>
          </label>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-500">{user?.workEmail}</p>
          <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full">{user?.role?.replace('_', ' ')}</span>
            {(user?.empId || profile?.emp_id) && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                ID: {user?.empId || profile?.emp_id}
              </span>
            )}
            {profile?.doj && <span>Joined: {formatIndianDate(profile?.doj)}</span>}
          </div>
        </div>
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

      {/* ── Personal Info ─────────────────────────────────────────── */}
      {activeTab === 'Personal Info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Personal Information</h2>
          <form onSubmit={personalForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...personalForm.register('gender')}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <Input label="Date of Birth" type="date" {...personalForm.register('dob')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Blood Group</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...personalForm.register('blood_group')}>
                  <option value="">Select...</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <Input label="Phone Number" type="tel" placeholder="+91 9876543210" {...personalForm.register('phone')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Emergency Contact Name" placeholder="Full name" {...personalForm.register('emergency_contact_name')} />
              <Input label="Emergency Contact Number" type="tel" placeholder="+91 9876543210" {...personalForm.register('emergency_contact')} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <textarea rows={3} placeholder="House no., Street, City, State, PIN"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                {...personalForm.register('address')} />
            </div>

            <Button type="submit" loading={profileMutation.isPending}>Save Changes</Button>
          </form>
        </div>
      )}

      {/* ── Bank Details ──────────────────────────────────────────── */}
      {activeTab === 'Bank Details' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Bank Details</h2>
          <p className="text-sm text-gray-400 mb-5">Used for payroll processing. Kept confidential.</p>
          <form onSubmit={bankForm.handleSubmit((d) => bankMutation.mutate(d))} className="space-y-4" noValidate>
            <Input label="Bank Name" placeholder="e.g. State Bank of India" {...bankForm.register('bank_name')} />
            <Input label="Account Number" placeholder="Enter account number" {...bankForm.register('account_number')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="IFSC Code" placeholder="e.g. SBIN0001234" {...bankForm.register('ifsc_code')} />
              <Input label="Branch Name" placeholder="e.g. Hyderabad Main" {...bankForm.register('branch_name')} />
            </div>
            <Button type="submit" loading={bankMutation.isPending}>Save Bank Details</Button>
          </form>
        </div>
      )}

      {/* ── Documents ─────────────────────────────────────────────── */}
      {activeTab === 'Documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Documents</h2>
          <p className="text-sm text-gray-400 mb-5">Upload your official documents. PDF, JPEG, PNG up to 10MB each.</p>
          <div className="space-y-3">
            {DOC_TYPES.map((dt) => {
              const uploaded = uploadedKeys[dt.key];
              return (
                <div key={dt.key} className={`flex items-center justify-between p-4 rounded-xl border ${uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <svg className={`w-4 h-4 ${uploaded ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{dt.label}</p>
                      {uploaded ? (
                        <p className="text-xs text-green-600 truncate">
                          ✓ {dt.label}{uploaded.original_name.substring(uploaded.original_name.lastIndexOf('.'))}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Not uploaded</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {/* View */}
                    {uploaded && (
                      <a href={getFileUrl(uploaded.file_path)} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium px-2 py-1 bg-blue-50 rounded-lg">
                        View
                      </a>
                    )}
                    {/* Upload / Replace */}
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) handleDocUpload(dt.key, e.target.files[0]); }}
                        aria-label={`Upload ${dt.label}`} />
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        uploading[dt.key] ? 'bg-gray-100 text-gray-400' :
                        uploaded ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' :
                        'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}>
                        {uploading[dt.key] ? 'Uploading...' : uploaded ? 'Replace' : 'Upload'}
                      </span>
                    </label>
                    {/* Delete */}
                    {uploaded && (
                      <button onClick={() => handleDocDelete(uploaded.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Remove ${dt.label}`}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Change Password (OTP-based multi-step) ─────────────────── */}
      {activeTab === 'Change Password' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Change Password</h2>
          <p className="text-sm text-gray-400 mb-5">Verify your identity with your personal email to change your password</p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  pwdStep >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{s}</div>
                <span className={`text-xs font-medium hidden sm:inline ${
                  pwdStep >= s ? 'text-blue-600' : 'text-gray-400'
                }`}>{s === 1 ? 'Email' : s === 2 ? 'OTP' : 'Password'}</span>
                {s < 3 && <div className={`w-8 h-0.5 ${pwdStep > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Enter personal email */}
          {pwdStep === 1 && (
            <form
              onSubmit={(e) => { e.preventDefault(); sendOtpMutation.mutate({ personal_email: pwdEmail }); }}
              className="space-y-4 max-w-md" noValidate
            >
              <Input
                label="Personal Email"
                type="email"
                placeholder="Enter your registered personal email"
                value={pwdEmail}
                onChange={(e) => setPwdEmail(e.target.value)}
                required
              />
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                We'll send a 6-digit OTP to verify your identity before allowing a password change.
              </div>
              <Button type="submit" loading={sendOtpMutation.isPending}>
                Send OTP
              </Button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {pwdStep === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pwdOtp.length !== 6) { toast.error('OTP must be 6 digits'); return; }
                setPwdStep(3);
              }}
              className="space-y-4 max-w-md" noValidate
            >
              <p className="text-sm text-gray-600">
                OTP sent to <span className="font-semibold text-gray-800">{pwdEmail}</span>
              </p>
              <Input
                label="OTP Code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={pwdOtp}
                onChange={(e) => setPwdOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <div className="flex gap-3">
                <Button type="submit">Verify OTP</Button>
                <button
                  type="button"
                  onClick={() => { setPwdStep(1); setPwdOtp(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >Back</button>
                <button
                  type="button"
                  onClick={() => sendOtpMutation.mutate({ personal_email: pwdEmail })}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  disabled={sendOtpMutation.isPending}
                >{sendOtpMutation.isPending ? 'Sending...' : 'Resend OTP'}</button>
              </div>
            </form>
          )}

          {/* Step 3: Set new password */}
          {pwdStep === 3 && (
            <form onSubmit={handlePwd((d) => passwordMutation.mutate(d))} className="space-y-4 max-w-md" noValidate>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Identity verified. Set your new password below.
              </div>
              <Input label="New Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                error={pwdErrors.new_password?.message} required {...regPwd('new_password')} />
              <Input label="Confirm New Password" type="password" placeholder="Repeat new password"
                error={pwdErrors.confirm_password?.message} required {...regPwd('confirm_password')} />
              <div className="flex gap-3">
                <Button type="submit" loading={passwordMutation.isPending}>Change Password</Button>
                <button
                  type="button"
                  onClick={() => { setPwdStep(1); setPwdEmail(''); setPwdOtp(''); resetPwd(); }}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
