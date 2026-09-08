import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { employeeFormApi } from '../../api/employeeForm.api';
import { queryClient } from '../../config/queryClient';
import { formatIndianDate } from '../../utils/dateHelpers';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  submitted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved:  'bg-green-100 text-green-700 border-green-200',
  rejected:  'bg-red-100 text-red-600 border-red-200',
  draft:     'bg-gray-100 text-gray-600 border-gray-200',
};

export default function HRFormsVerificationPage() {
  const [viewForm, setViewForm]     = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [comment, setComment]       = useState('');
  const [filterStatus, setFilterStatus] = useState('submitted');

  const { data, isLoading } = useQuery({
    queryKey: ['employee-forms', filterStatus],
    queryFn: async () => {
      const r = await employeeFormApi.getAllForms({ status: filterStatus === 'all' ? undefined : filterStatus });
      return r.data.data || [];
    },
    staleTime: 0,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }) => employeeFormApi.reviewForm(id, { action, comment }),
    onSuccess: (_, { action }) => {
      toast.success(action === 'approve' ? '✅ Forms approved!' : '❌ Forms rejected — employee notified.');
      setReviewModal(null); setComment('');
      queryClient.invalidateQueries({ queryKey: ['employee-forms'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Action failed'),
  });

  const forms = data || [];
  const pendingCount = forms.filter(f => f.status === 'submitted').length;

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Forms Verification</h1>
          <p className="text-gray-400 text-sm mt-0.5">Review Joining Letters and Personal Info forms submitted by new employees</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{key:'submitted',label:'Pending'},{key:'approved',label:'Approved'},{key:'rejected',label:'Rejected'},{key:'all',label:'All'}].map(f=>(
          <button key={f.key} onClick={()=>setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus===f.key?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-800'}`}>
            {f.label}
            {f.key==='submitted' && pendingCount>0 && <span className="ml-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">No {filterStatus === 'submitted' ? 'pending' : filterStatus} forms</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => (
            <div key={form.id} className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${form.status==='submitted'?'border-yellow-300':'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {form.employee?.first_name} {form.employee?.last_name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[form.status]}`}>
                      {form.status === 'submitted' ? '⏳ Pending Review' :
                       form.status === 'approved'  ? '✅ Approved' :
                       form.status === 'rejected'  ? '❌ Rejected' : form.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {form.employee?.emp_id && <span className="font-medium">{form.employee.emp_id} · </span>}
                    {form.employee?.work_email} · {form.employee?.role?.replace('_',' ')}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                    {form.submitted_at && <span>Submitted: {formatIndianDate(form.submitted_at)}</span>}
                    {form.reviewed_at && <span>Reviewed: {formatIndianDate(form.reviewed_at)}</span>}
                    {form.reviewer && <span>By: {form.reviewer.first_name} {form.reviewer.last_name}</span>}
                  </div>
                  {form.hr_comment && (
                    <p className="text-xs text-red-600 mt-1.5 italic">Comment: "{form.hr_comment}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={()=>setViewForm(form)}>View Forms</Button>
                  {form.status === 'approved' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => downloadJoiningLetterPDF(form)}>
                        📄 Joining Letter
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadPersonalInfoPDF(form)}>
                        📋 Personal Info
                      </Button>
                    </>
                  )}
                  {form.status === 'submitted' && (
                    <Button size="sm" onClick={()=>{setReviewModal(form); setComment('');}}>Review & Decide</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── View Forms Modal ─── */}
      <Modal isOpen={!!viewForm} onClose={()=>setViewForm(null)}
        title={viewForm ? `${viewForm.employee?.first_name} ${viewForm.employee?.last_name} — Submitted Forms` : ''} size="lg">
        {viewForm && <FormViewer form={viewForm} onReview={()=>{setReviewModal(viewForm);setComment('');setViewForm(null);}} />}
      </Modal>

      {/* ── Review Modal ─── */}
      <Modal isOpen={!!reviewModal} onClose={()=>setReviewModal(null)}
        title={`Review: ${reviewModal?.employee?.first_name} ${reviewModal?.employee?.last_name}`} size="sm">
        {reviewModal && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              Review the submitted Joining Letter and Personal Information form for <strong>{reviewModal.employee?.first_name}</strong>.
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Comment <span className="text-xs text-gray-400">(required for rejection)</span></label>
              <textarea rows={3} value={comment} onChange={e=>setComment(e.target.value)}
                placeholder="Add a verification comment..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={()=>reviewMutation.mutate({id:reviewModal.id,action:'approve'})}
                disabled={reviewMutation.isPending}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg">
                {reviewMutation.isPending ? 'Processing...' : '✓ Approve'}
              </button>
              <button onClick={()=>reviewMutation.mutate({id:reviewModal.id,action:'reject'})}
                disabled={reviewMutation.isPending || !comment.trim()}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg">
                ✕ Reject
              </button>
            </div>
            {!comment.trim() && <p className="text-xs text-gray-400 text-center">Add a comment to enable rejection</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── PDF download helpers ───────────────────────────────────────────── */
function openPrintWindow(html, title) {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700&family=Inter:wght@400;500;600;700&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Merriweather',serif; font-size:13px; line-height:1.7; color:#1a1a1a; padding:48px 56px; }
      .header { text-align:center; margin-bottom:32px; border-bottom:2px solid #1e3a5f; padding-bottom:12px; }
      .header h1 { font-family:'Inter',sans-serif; font-size:20px; color:#1e3a5f; letter-spacing:2px; }
      .header p { font-size:10px; color:#555; font-family:'Inter',sans-serif; margin-top:2px; }
      .meta { text-align:right; margin-bottom:24px; font-size:12px; color:#444; }
      .section { margin-bottom:16px; }
      .section p { margin-bottom:8px; }
      .bold { font-weight:700; }
      .signature { margin-top:40px; }
      .signature-line { width:200px; border-top:1px solid #333; margin-top:40px; padding-top:4px; font-size:11px; color:#555; }
      /* Personal Info table styles */
      table.info { width:100%; border-collapse:collapse; font-family:'Inter',sans-serif; font-size:12px; }
      table.info th, table.info td { border:1px solid #ddd; padding:8px 12px; text-align:left; }
      table.info th { background:#f5f7fa; font-weight:600; color:#333; width:35%; }
      table.info td { color:#1a1a1a; }
      .sub-heading { font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:#1e3a5f; margin:24px 0 8px; }
      @media print { body { padding:24px 32px; } }
    </style></head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function downloadJoiningLetterPDF(form) {
  const emp = form.employee || {};
  const name = `${emp.first_name || ''} ${emp.last_name || ''}`;
  const letterDate = form.letter_date ? formatIndianDate(form.letter_date) : '___';
  const joiningDate = form.joining_date ? formatIndianDate(form.joining_date) : '___';
  const html = `
    <div class="header">
      <h1>SAVEN TECHNOLOGIES LIMITED</h1>
      <p>First Floor, Level-1, Block 2, Cyber Pearl, Hi-Tech City, Madhapur, Hyderabad-500081</p>
    </div>
    <div class="meta">${letterDate}</div>
    <div class="section">
      <p>From,</p>
      <p class="bold">${name}</p>
      ${form.joining_address ? `<p>${form.joining_address}</p>` : ''}
    </div>
    <div class="section">
      <p class="bold">Subject: Joining Letter</p>
    </div>
    <div class="section">
      <p>To,</p>
      <p class="bold">Saven Technologies Limited,</p>
      <p style="font-size:12px;color:#444;">First Floor, Level-1, Block 2, Cyber Pearl, Hi-Tech City, Madhapur, Hyderabad-500081.</p>
    </div>
    <div class="section">
      <p>I am pleased to accept your offer and I have honour to inform you that I am joining the company from <strong>${joiningDate}</strong> as <strong>${form.joining_designation || '___'}</strong> in respect to your Offer.</p>
      <p>The position is ideally suited to my educational background and interests. I confidently feel that I can make a significant contribution to your company and I am grateful for the opportunity you have given me.</p>
      <p>I humbly request you to accept my joining / acceptance letter.</p>
    </div>
    <div class="signature">
      <p>Regards,</p>
      <div class="signature-line">Employee Signature</div>
      <p class="bold" style="margin-top:4px;">${form.signature_name || name}</p>
    </div>
  `;
  openPrintWindow(html, `Joining Letter - ${name}`);
}

function downloadPersonalInfoPDF(form) {
  const emp = form.employee || {};
  const name = `${emp.first_name || ''} ${form.middle_name || ''} ${emp.last_name || ''}`.replace(/\s+/g,' ').trim();

  const rows = [
    ['Employee No', emp.emp_id],
    ['Full Name', name],
    ['Date of Birth', form.dob ? formatIndianDate(form.dob) : null],
    ['Blood Group', form.blood_group],
    ['Marital Status', form.marital_status],
    ['Mobile', form.present_phone],
    ['Designation', form.designation],
    ['PAN Number', form.pan_number],
    ['Aadhaar Number', form.aadhaar_number],
    ['Passport Number', form.passport_number],
    ['Present Address', form.present_address ? `${form.present_address}, ${form.present_city||''}, ${form.present_state||''} - ${form.present_pincode||''}` : null],
    ['Permanent Address', form.permanent_address ? `${form.permanent_address}, ${form.permanent_city||''}, ${form.permanent_state||''} - ${form.permanent_pincode||''}` : null],
    ['Emergency Contact 1', form.emergency_contact_1],
    ['Emergency Contact 2', form.emergency_contact_2],
    ['Hobbies', form.hobbies],
    ['Serious Illness', form.serious_illness],
    ['Other Info', form.other_info],
  ].filter(([,v]) => v);

  let qualHtml = '';
  if (Array.isArray(form.qualification_details) && form.qualification_details.some(q => q.institution)) {
    qualHtml = `<p class="sub-heading">Qualifications</p><table class="info"><tr><th>Level</th><th>Institution</th><th>Percentage</th><th>Duration</th></tr>` +
      form.qualification_details.filter(q => q.institution).map(q =>
        `<tr><td>${q.level||''}</td><td>${q.institution||''}</td><td>${q.percentage ? q.percentage+'%' : '—'}</td><td>${q.duration||'—'}</td></tr>`
      ).join('') + '</table>';
  }

  let famHtml = '';
  if (Array.isArray(form.family_details) && form.family_details.some(f => f.name)) {
    famHtml = `<p class="sub-heading">Family Details</p><table class="info"><tr><th>Name</th><th>Relationship</th><th>DOB</th><th>Blood Group</th></tr>` +
      form.family_details.filter(f => f.name).map(f =>
        `<tr><td>${f.name||''}</td><td>${f.relationship||''}</td><td>${f.dob||'—'}</td><td>${f.blood_group||'—'}</td></tr>`
      ).join('') + '</table>';
  }

  const html = `
    <div class="header">
      <h1>SAVEN TECHNOLOGIES LIMITED</h1>
      <p>Personal Information Form</p>
    </div>
    <table class="info">${rows.map(([l,v]) => `<tr><th>${l}</th><td>${v}</td></tr>`).join('')}</table>
    ${qualHtml}
    ${famHtml}
  `;
  openPrintWindow(html, `Personal Info - ${emp.first_name} ${emp.last_name}`);
}

function FormViewer({ form, onReview }) {
  const [tab, setTab] = useState('joining');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[['joining','📄 Joining Letter'],['personal','👤 Personal Info']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab===k?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>{l}</button>
        ))}
      </div>

      {tab==='joining' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 space-y-3 font-serif leading-relaxed">
          <p><strong>Date:</strong> {form.letter_date ? formatIndianDate(form.letter_date) : '—'}</p>
          <p><strong>From:</strong> {form.employee?.first_name} {form.employee?.last_name}</p>
          {form.joining_address && <p className="whitespace-pre-line">{form.joining_address}</p>}
          <p><strong>Subject:</strong> Joining Letter</p>
          <p>To,<br/><strong>Saven Technologies Limited,</strong><br/>
          <span className="text-xs">First Floor, Level-1, Block 2, Cyber Pearl, Hi-Tech City, Madhapur, Hyderabad-500081.</span></p>
          <p>I am pleased to accept your offer and I am joining the company from <strong>{form.joining_date ? formatIndianDate(form.joining_date) : '___'}</strong> as <strong>{form.joining_designation || '___'}</strong> in respect to your Offer.</p>
          <p>The position is ideally suited to my educational background and interests. I confidently feel that I can make a significant contribution to your company and I am grateful for the opportunity given to me.</p>
          <p>I humbly request you to accept my joining / acceptance letter.</p>
          <p className="mt-4">Regards,<br/><strong>{form.signature_name || `${form.employee?.first_name} ${form.employee?.last_name}`}</strong></p>
        </div>
      )}

      {tab==='personal' && (
        <div className="space-y-3 max-h-[450px] overflow-y-auto">
          {[
            ['Emp No', form.employee?.emp_id],
            ['Full Name', `${form.employee?.first_name} ${form.middle_name||''} ${form.employee?.last_name}`],
            ['Mobile', form.present_phone],
            ['Date of Birth', form.dob ? formatIndianDate(form.dob) : null],
            ['Blood Group', form.blood_group],
            ['Marital Status', form.marital_status],
            ['Designation', form.designation],
            ['PAN', form.pan_number],
            ['Aadhaar', form.aadhaar_number],
            ['Passport', form.passport_number],
            ['Present Address', form.present_address ? `${form.present_address}, ${form.present_city||''}, ${form.present_state||''} - ${form.present_pincode||''}` : null],
            ['Permanent Address', form.permanent_address ? `${form.permanent_address}, ${form.permanent_city||''}, ${form.permanent_state||''} - ${form.permanent_pincode||''}` : null],
            ['Emergency 1', form.emergency_contact_1],
            ['Emergency 2', form.emergency_contact_2],
            ['Hobbies', form.hobbies],
            ['Serious Illness', form.serious_illness],
            ['Other Info', form.other_info],
          ].map(([label, val]) => val ? (
            <div key={label} className="flex gap-3 text-sm border-b border-gray-50 pb-2">
              <span className="text-gray-400 w-36 shrink-0">{label}</span>
              <span className="text-gray-800 font-medium">{val}</span>
            </div>
          ) : null)}
          {Array.isArray(form.qualification_details) && form.qualification_details.some(q=>q.institution) && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Qualifications</p>
              {form.qualification_details.filter(q=>q.institution).map((q,i)=>(
                <div key={i} className="text-sm border-b border-gray-50 pb-1.5 flex gap-3">
                  <span className="text-gray-400 w-28 shrink-0">{q.level}</span>
                  <span className="text-gray-700">{q.institution} {q.percentage ? `· ${q.percentage}%` : ''} {q.duration ? `· ${q.duration}` : ''}</span>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(form.family_details) && form.family_details.some(f=>f.name) && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Family Details</p>
              {form.family_details.filter(f=>f.name).map((f,i)=>(
                <div key={i} className="text-sm border-b border-gray-50 pb-1.5">{f.name} — {f.relationship} {f.dob ? `(DOB: ${f.dob})` : ''} {f.blood_group ? `· ${f.blood_group}` : ''}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {form.status === 'submitted' && (
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button onClick={onReview}>Review & Decide</Button>
        </div>
      )}
    </div>
  );
}
