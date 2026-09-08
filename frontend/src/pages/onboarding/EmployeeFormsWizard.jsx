import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { employeeFormApi } from '../../api/employeeForm.api';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import JoiningLetterStep from './JoiningLetterStep';
import PersonalInfoStep from './PersonalInfoStep';

const STEPS = ['Joining Letter', 'Personal Info', 'Review & Submit'];

export default function EmployeeFormsWizard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({});

  // Admins/HR should never be on this page
  useEffect(() => {
    if (user?.role && ['super_admin','hr','payroll'].includes(user.role)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.role]);

  const { data: formData, isLoading } = useQuery({
    queryKey: ['my-employee-form'],
    queryFn: async () => { const r = await employeeFormApi.getMyForm(); return r.data.data; },
    onSuccess: (d) => {
      if (d) setDraft(d);
      // If already submitted/approved — persist flag so ProtectedRoute allows dashboard access
      if (d?.status === 'submitted' || d?.status === 'approved') {
        if (user?.id) localStorage.setItem(`form_submitted_${user.id}`, 'true');
        updateUser({ formSubmitted: true });
      }
    },
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => employeeFormApi.saveForm(data),
    onSuccess: () => toast.success('Draft saved'),
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => employeeFormApi.submitForm(data),
    onSuccess: () => {
      toast.success('Forms submitted! Now complete your profile details.');
      if (user?.id) localStorage.setItem(`form_submitted_${user.id}`, 'true');
      updateUser({ formSubmitted: true });
      navigate('/settings?setup=1');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Submit failed'),
  });

  function update(fields) { setDraft(p => ({ ...p, ...fields })); }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = formData?.status;

  // ── If submitted or approved — show view-only status page ──────────────────
  if (status === 'submitted' || status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto space-y-5 py-6">
        {/* Status banner */}
        <div className={`rounded-xl border p-5 flex items-start gap-4 ${status === 'approved' ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'}`}>
          <span className="text-3xl">{status === 'approved' ? '✅' : '⏳'}</span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              {status === 'approved' ? 'Forms Approved!' : 'Forms Submitted — Awaiting HR Review'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {status === 'approved'
                ? 'HR has verified your joining details. Your forms are complete.'
                : 'Your forms are with HR for verification. You will be notified once reviewed.'}
            </p>
            <button onClick={() => navigate('/dashboard')}
              className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 underline">
              Go to Dashboard →
            </button>
          </div>
        </div>

        {/* View-only form summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Submitted Details</p>
          {[
            ['Letter Date', draft.letter_date],
            ['Joining Date', draft.joining_date],
            ['Joining Designation', draft.joining_designation],
            ['Date of Birth', draft.dob],
            ['Mobile', draft.present_phone],
            ['Present City', draft.present_city],
            ['Blood Group', draft.blood_group],
            ['Marital Status', draft.marital_status],
            ['PAN', draft.pan_number],
            ['Aadhaar', draft.aadhaar_number],
          ].map(([label, val]) => val ? (
            <div key={label} className="flex gap-3 text-sm border-b border-gray-50 pb-1.5">
              <span className="text-gray-400 w-36 shrink-0">{label}</span>
              <span className="text-gray-800 font-medium">{val}</span>
            </div>
          ) : null)}
          <p className="text-xs text-gray-400 pt-1">
            {status === 'approved' ? '🔒 View only — forms are approved' : '🔒 View only — awaiting HR review'}
          </p>
        </div>
      </div>
    );
  }

  // ── If rejected — show editable form with rejection notice ─────────────────
  const isRejected = status === 'rejected';

  return (
    <div className={`${!user?.formSubmitted ? 'min-h-screen bg-gray-50 flex items-center justify-center p-4' : 'py-6'}`}>
      <div className="w-full max-w-3xl">
        {/* Header — shown only on first fill (not from sidebar) */}
        {!user?.formSubmitted && (
          <div className="text-center mb-8">
            <img src="/saven-logo.png" alt="Saven" className="h-14 mx-auto mb-4" style={{objectFit:'fill'}} />
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}! 🎉</h1>
            <p className="text-gray-500 mt-1 text-sm">Complete your joining formalities</p>
          </div>
        )}

        {/* Sidebar header when accessed after submission (rejected) */}
        {user?.formSubmitted && isRejected && (
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-gray-900">My Joining Forms</h1>
            <p className="text-gray-400 text-sm mt-0.5">Update your forms as requested by HR</p>
          </div>
        )}

        {/* Rejected banner */}
        {isRejected && formData?.hr_comment && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-xl p-4 flex gap-3">
            <span className="text-xl shrink-0">❌</span>
            <div>
              <p className="text-sm font-semibold text-red-800">HR requested corrections</p>
              <p className="text-sm text-red-700 mt-0.5">{formData.hr_comment}</p>
              <p className="text-xs text-red-500 mt-1">Please correct the details below and resubmit.</p>
            </div>
          </div>
        )}

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < step ? 'bg-blue-600 border-blue-600 text-white' :
                  i === step ? 'border-blue-600 text-blue-600 bg-white' :
                  'border-gray-300 text-gray-400 bg-white'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-blue-600' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {step === 0 && (
            <JoiningLetterStep draft={draft} update={update} user={user}
              onNext={() => { saveMutation.mutate(draft); setStep(1); }}
              saving={saveMutation.isPending} />
          )}
          {step === 1 && (
            <PersonalInfoStep draft={draft} update={update} user={user}
              onBack={() => setStep(0)}
              onNext={() => { saveMutation.mutate(draft); setStep(2); }}
              saving={saveMutation.isPending} />
          )}
          {step === 2 && (
            <ReviewStep draft={draft} user={user} isResubmit={isRejected}
              onBack={() => setStep(1)}
              onSubmit={() => submitMutation.mutate(draft)}
              submitting={submitMutation.isPending} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ draft, user, onBack, onSubmit, submitting, isResubmit }) {
  const checks = [
    { label: 'Letter date filled', ok: !!draft.letter_date },
    { label: 'Joining date filled', ok: !!draft.joining_date },
    { label: 'Joining designation filled', ok: !!draft.joining_designation },
    { label: 'Date of Birth filled', ok: !!draft.dob },
    { label: 'Present address filled', ok: !!draft.present_address },
    { label: 'Mobile number filled', ok: !!draft.present_phone },
    { label: 'Emergency contact 1 filled', ok: !!draft.emergency_contact_1 },
  ];
  const allGood = checks.every(c => c.ok);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Review & {isResubmit ? 'Resubmit' : 'Submit'}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Check the details below before submitting to HR</p>
      </div>

      <div className="space-y-2">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-3 p-3 rounded-lg border ${c.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <span>{c.ok ? '✅' : '❌'}</span>
            <p className={`text-sm ${c.ok ? 'text-green-800' : 'text-red-700'}`}>{c.label}</p>
          </div>
        ))}
      </div>

      {!allGood && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          ⚠ Please fill the missing required fields before submitting.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">{isResubmit ? 'Resubmitting to HR' : 'What happens next?'}</p>
        <ul className="list-disc ml-4 space-y-0.5 text-blue-700">
          {isResubmit
            ? <><li>HR will review your corrected forms</li><li>You'll be notified of the result</li></>
            : <><li>You'll be taken to your dashboard immediately</li><li>HR will review your forms in the background</li><li>You'll get a notification when HR approves or requests changes</li></>
          }
        </ul>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={onSubmit} loading={submitting} disabled={!allGood}
          className="bg-green-600 hover:bg-green-700 text-white border-0">
          {isResubmit ? 'Resubmit to HR ↺' : 'Submit & Go to Dashboard →'}
        </Button>
      </div>
    </div>
  );
}
