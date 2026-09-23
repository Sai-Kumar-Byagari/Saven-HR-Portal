import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { profileApi } from '../../api/profile.api';
import { documentsApi } from '../../api/documents.api';
import { onboardingApi } from '../../api/onboarding.api';
import { queryClient } from '../../config/queryClient';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectUser, updateUser } from '../../store/slices/authSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const STEPS = ['Personal Details', 'Documents', 'Bank Details', 'Review & Submit'];

const DOC_TYPES = [
  { key: 'ssc', label: 'SSC Memo' },
  { key: '12th', label: '12th Memo' },
  { key: 'degree', label: 'Degree Certificate' },
  { key: 'aadhar', label: 'Aadhaar Card' },
  { key: 'pan', label: 'PAN Card' },
  { key: 'resume', label: 'Resume' },
  { key: 'offer_letter', label: 'Offer Letter' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [personalData, setPersonalData] = useState({});
  const [bankData, setBankData] = useState({});

  const personalForm = useForm();
  const bankForm = useForm();

  const profileMutation = useMutation({
    mutationFn: (data) => profileApi.update(data),
    onSuccess: (_, data) => { setPersonalData(data); setStep(1); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const bankMutation = useMutation({
    mutationFn: (data) => profileApi.updateBankDetails(data),
    onSuccess: (_, data) => { setBankData(data); setStep(3); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const completeMutation = useMutation({
    mutationFn: onboardingApi.complete,
    onSuccess: () => {
      dispatch(updateUser({ onboardingComplete: true }));
      toast.success('Onboarding complete! Welcome to Saven Technologies! 🎉');
      queryClient.invalidateQueries();
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  async function uploadDoc(docType, file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', docType);
    try {
      await documentsApi.upload(fd);
      setUploadedDocs((prev) => ({ ...prev, [docType]: file.name }));
      toast.success(`${docType} uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to upload ${docType}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}! 🎉</h1>
          <p className="text-gray-500 mt-1">Let's complete your onboarding in a few quick steps</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                  ${i < step ? 'bg-blue-600 border-blue-600 text-white' : i === step ? 'border-blue-600 text-blue-600 bg-white' : 'border-gray-300 text-gray-400 bg-white'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-blue-600' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {/* Step 0: Personal Details */}
          {step === 0 && (
            <form onSubmit={personalForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4" noValidate>
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Personal Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...personalForm.register('gender')}>
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
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...personalForm.register('blood_group')}>
                    <option value="">Select...</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <Input label="Phone Number" type="tel" placeholder="+91 9876543210" {...personalForm.register('phone')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Emergency Contact Name" {...personalForm.register('emergency_contact_name')} />
                <Input label="Emergency Contact Number" type="tel" {...personalForm.register('emergency_contact')} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <textarea rows={2} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" {...personalForm.register('address')} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={profileMutation.isPending}>Save & Continue →</Button>
              </div>
            </form>
          )}

          {/* Step 1: Documents */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Upload Documents</h2>
              <p className="text-sm text-gray-500 mb-4">Upload your documents. Each file should be PDF, JPEG, or PNG (max 10MB).</p>
              <div className="space-y-3">
                {DOC_TYPES.map((dt) => (
                  <div key={dt.key} className={`flex items-center justify-between p-3 rounded-lg border ${uploadedDocs[dt.key] ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{dt.label}</p>
                      {uploadedDocs[dt.key] && (
                        <p className="text-xs text-green-600 mt-0.5">✓ {uploadedDocs[dt.key]}</p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) uploadDoc(dt.key, e.target.files[0]); }}
                        aria-label={`Upload ${dt.label}`} />
                      <span className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${uploadedDocs[dt.key] ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
                        {uploadedDocs[dt.key] ? 'Replace' : 'Upload'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={() => setStep(2)}>Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 2: Bank Details */}
          {step === 2 && (
            <form onSubmit={bankForm.handleSubmit((d) => bankMutation.mutate(d))} className="space-y-4" noValidate>
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Bank Details</h2>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">Your bank details are used only for payroll processing and are kept confidential.</p>
              <Input label="Bank Name" placeholder="e.g. State Bank of India" {...bankForm.register('bank_name')} />
              <Input label="Account Number" placeholder="Enter account number" {...bankForm.register('account_number')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="IFSC Code" placeholder="e.g. SBIN0001234" {...bankForm.register('ifsc_code')} />
                <Input label="Branch Name" placeholder="e.g. Hyderabad Main" {...bankForm.register('branch_name')} />
              </div>
              <div className="flex justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                <Button type="submit" loading={bankMutation.isPending}>Save & Continue →</Button>
              </div>
            </form>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Review & Submit</h2>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex gap-2">
                  <span>✓</span><span>Personal details saved</span>
                </div>
                <div className={`rounded-lg p-3 text-sm flex gap-2 ${Object.keys(uploadedDocs).length > 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
                  <span>{Object.keys(uploadedDocs).length > 0 ? '✓' : '!'}</span>
                  <span>{Object.keys(uploadedDocs).length} of {DOC_TYPES.length} documents uploaded</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex gap-2">
                  <span>✓</span><span>Bank details saved</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                You can update your profile and upload additional documents after onboarding from the Settings page.
              </p>
              <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
                <Button onClick={() => completeMutation.mutate()} loading={completeMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white">
                  Complete Onboarding 🎉
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
