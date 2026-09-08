import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { employeeFormApi } from '../../api/employeeForm.api';
import { formatIndianDate } from '../../utils/dateHelpers';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const STATUS_CONFIG = {
  approved:  { color: 'bg-green-50 border-green-300 text-green-800', icon: '✅', label: 'Approved by HR' },
  submitted: { color: 'bg-blue-50 border-blue-300 text-blue-800',   icon: '⏳', label: 'Pending HR Review' },
  rejected:  { color: 'bg-red-50 border-red-300 text-red-800',     icon: '❌', label: 'Corrections Requested' },
  draft:     { color: 'bg-gray-50 border-gray-300 text-gray-700',   icon: '📝', label: 'Draft — Not Submitted' },
};

export default function MyFormsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('joining');

  const { data, isLoading } = useQuery({
    queryKey: ['my-employee-form'],
    queryFn: async () => { const r = await employeeFormApi.getMyForm(); return r.data.data; },
    staleTime: 0,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const form = data;
  const status = form?.status || 'draft';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const canEdit = status === 'rejected' || status === 'draft';

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Joining Forms</h1>
          <p className="text-gray-400 text-sm mt-0.5">Joining Letter & Personal Information</p>
        </div>
        {/* Edit button — only enabled if rejected/draft */}
        <Button
          onClick={() => navigate('/onboarding/forms')}
          disabled={!canEdit}
          variant={canEdit ? 'primary' : 'secondary'}
          title={canEdit ? 'Edit your forms' : 'Forms can only be edited if HR requests corrections'}
        >
          {canEdit ? '✏️ Edit & Resubmit' : '🔒 View Only'}
        </Button>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${cfg.color}`}>
        <span className="text-xl shrink-0">{cfg.icon}</span>
        <div className="flex-1">
          <p className="font-semibold">{cfg.label}</p>
          {status === 'rejected' && form?.hr_comment && (
            <p className="text-sm mt-0.5">HR Comment: <strong>{form.hr_comment}</strong></p>
          )}
          {status === 'submitted' && (
            <p className="text-sm mt-0.5">Submitted on {form?.submitted_at ? formatIndianDate(form.submitted_at) : '—'}. HR will notify you once reviewed.</p>
          )}
          {status === 'approved' && form?.reviewed_at && (
            <p className="text-sm mt-0.5">Approved on {formatIndianDate(form.reviewed_at)}.</p>
          )}
          {status === 'rejected' && (
            <p className="text-xs mt-1 opacity-80">Click "Edit & Resubmit" above to correct and resubmit your forms.</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['joining','📄 Joining Letter'],['personal','👤 Personal Info']].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab===k?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-800'}`}>{l}</button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {activeTab === 'joining' && (
          <div className="space-y-3 font-serif text-sm text-gray-700 leading-relaxed">
            <div className="grid grid-cols-3 gap-4 mb-4 not-italic font-sans">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Letter Date</p>
                <p className="font-semibold text-gray-800 mt-0.5">{form?.letter_date ? formatIndianDate(form.letter_date) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Joining Date</p>
                <p className="font-semibold text-gray-800 mt-0.5">{form?.joining_date ? formatIndianDate(form.joining_date) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Designation</p>
                <p className="font-semibold text-gray-800 mt-0.5">{form?.joining_designation || '—'}</p>
              </div>
            </div>
            <p className="text-gray-600 text-xs font-sans">From Address:</p>
            <p className="whitespace-pre-line">{form?.joining_address || '—'}</p>
            <hr className="border-gray-100" />
            <p><strong>Subject:</strong> Joining Letter</p>
            <p>To,<br/><strong>Saven Technologies Limited,</strong><br/>
            <span className="text-xs text-gray-500">First Floor, Level-1, Block 2, Cyber Pearl, Hi-Tech City, Madhapur, Hyderabad-500081.</span></p>
            <p>I am pleased to accept your offer and I have honour to inform you that I am joining the company from <strong>{form?.joining_date ? formatIndianDate(form.joining_date) : '___'}</strong> as <strong>{form?.joining_designation || '___'}</strong> in respect to your Offer. The position is ideally suited to my educational background and interests. I confidently feel that I can make a significant contribution to your company.</p>
            <p>I humbly request you to accept my joining / acceptance letter.</p>
            <p className="mt-4">Regards,</p>
            <p className="font-semibold">Employee Signature</p>
            {!canEdit && <p className="text-xs text-gray-400 mt-2 font-sans">🔒 View only</p>}
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="space-y-3">
            {[
              ['Mobile', form?.present_phone],
              ['Date of Birth', form?.dob ? formatIndianDate(form.dob) : null],
              ['Blood Group', form?.blood_group],
              ['Marital Status', form?.marital_status],
              ['Designation', form?.designation],
              ['PAN Number', form?.pan_number],
              ['Aadhaar', form?.aadhaar_number],
              ['Passport No', form?.passport_number],
              ['Passport Expiry', form?.passport_expiry ? formatIndianDate(form.passport_expiry) : null],
              ['Place of Birth', form?.place_of_birth],
              ['District', form?.district],
              ['Present Address', form?.present_address ? `${form.present_address}, ${form.present_city||''}, ${form.present_state||''} - ${form.present_pincode||''}` : null],
              ['Permanent Address', form?.permanent_address ? `${form.permanent_address}, ${form.permanent_city||''}, ${form.permanent_state||''} - ${form.permanent_pincode||''}` : null],
              ['Emergency Contact 1', form?.emergency_contact_1],
              ['Emergency Contact 2', form?.emergency_contact_2],
              ['Hobbies', form?.hobbies],
              ['Serious Illness', form?.serious_illness],
              ['Other Info', form?.other_info],
            ].filter(([,v]) => v).map(([label, val]) => (
              <div key={label} className="flex gap-3 text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-400 w-36 shrink-0 text-xs">{label}</span>
                <span className="text-gray-800 font-medium">{val}</span>
              </div>
            ))}

            {Array.isArray(form?.qualification_details) && form.qualification_details.some(q=>q.institution) && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Qualifications</p>
                {form.qualification_details.filter(q=>q.institution).map((q,i)=>(
                  <div key={i} className="text-sm border-b border-gray-50 pb-1.5 flex gap-3">
                    <span className="text-gray-400 w-28 shrink-0 text-xs">{q.level}</span>
                    <span className="text-gray-700">{q.institution} {q.percentage?`· ${q.percentage}%`:''} {q.duration?`· ${q.duration}`:''}</span>
                  </div>
                ))}
              </div>
            )}

            {Array.isArray(form?.employment_history) && form.employment_history.some(e=>e.org) && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Employment History</p>
                {form.employment_history.filter(e=>e.org).map((e,i)=>(
                  <div key={i} className="text-sm border-b border-gray-50 pb-1.5">
                    <span className="font-medium">{e.org}</span> — {e.designation}
                    {(e.from_date||e.to_date) && <span className="text-gray-400 text-xs ml-2">{e.from_date} to {e.to_date||'Present'}</span>}
                  </div>
                ))}
              </div>
            )}

            {Array.isArray(form?.family_details) && form.family_details.some(f=>f.name) && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Family Details</p>
                {form.family_details.filter(f=>f.name).map((f,i)=>(
                  <div key={i} className="text-sm border-b border-gray-50 pb-1.5">
                    {f.name} — {f.relationship} {f.dob?`(DOB: ${f.dob})`:''} {f.blood_group?`· ${f.blood_group}`:''}
                  </div>
                ))}
              </div>
            )}

            {!canEdit && <p className="text-xs text-gray-400 mt-3">🔒 View only — {status === 'approved' ? 'approved by HR' : 'awaiting HR review'}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
