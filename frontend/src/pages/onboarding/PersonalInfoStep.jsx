import { useState } from 'react';
import Button from '../../components/ui/Button';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const QUAL_LEVELS = ['S.S.C','H.S.C','Diploma','Graduate','Post Graduate'];

function Field({ label, children, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
function TI({ value, onChange, placeholder, type='text', className='' }) {
  return <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} />;
}

export default function PersonalInfoStep({ draft, update, user, onBack, onNext, saving }) {
  const [section, setSection] = useState(0);
  const SECTIONS = ['Personal Details','Address','Identity Docs','Qualifications','Employment','Family & Other'];

  function qual(idx, key, val) {
    const q = [...(draft.qualification_details || QUAL_LEVELS.map(l=>({level:l,institution:'',percentage:'',duration:''})))];
    q[idx] = {...q[idx], [key]: val};
    update({ qualification_details: q });
  }
  function empRow(idx, key, val) {
    const e = [...(draft.employment_history || [{org:'',designation:'',description:'',from_date:'',to_date:''}])];
    e[idx] = {...e[idx], [key]: val};
    update({ employment_history: e });
  }
  function addEmpRow() {
    update({ employment_history: [...(draft.employment_history||[]), {org:'',designation:'',description:'',from_date:'',to_date:''}] });
  }
  function famRow(idx, key, val) {
    const f = [...(draft.family_details || [{name:'',relationship:'',dob:'',occupation:'',blood_group:''}])];
    f[idx] = {...f[idx], [key]: val};
    update({ family_details: f });
  }
  function addFamRow() {
    update({ family_details: [...(draft.family_details||[]), {name:'',relationship:'',dob:'',occupation:'',blood_group:''}] });
  }

  const quals = draft.qualification_details?.length === QUAL_LEVELS.length
    ? draft.qualification_details
    : QUAL_LEVELS.map((l,i) => draft.qualification_details?.[i] || {level:l,institution:'',percentage:'',duration:''});
  const emp = draft.employment_history || [{org:'',designation:'',description:'',from_date:'',to_date:''}];
  const fam = draft.family_details || [{name:'',relationship:'',dob:'',occupation:'',blood_group:''}];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Employee Personal Information Form</h2>
        <p className="text-sm text-gray-500 mt-0.5">Fill all details as per your official records</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 flex-wrap">
        {SECTIONS.map((s,i) => (
          <button key={s} onClick={() => setSection(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${section===i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {i+1}. {s}
          </button>
        ))}
      </div>

      {/* ─── Section 0: Personal Details ─── */}
      {section===0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="First Name" required><TI value={user?.firstName} onChange={()=>{}} className="bg-gray-50" /></Field>
            <Field label="Middle Name"><TI value={draft.middle_name} onChange={v=>update({middle_name:v})} placeholder="Middle name" /></Field>
            <Field label="Last Name" required><TI value={user?.lastName} onChange={()=>{}} className="bg-gray-50" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emp. No" required><TI value={user?.empId||''} onChange={()=>{}} className="bg-gray-50" /></Field>
            <Field label="Mobile No" required><TI value={draft.present_phone} onChange={v=>update({present_phone:v})} placeholder="+91 9876543210" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Designation"><TI value={draft.designation} onChange={v=>update({designation:v})} /></Field>
            <Field label="Blood Group">
              <select value={draft.blood_group||''} onChange={e=>update({blood_group:e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {BLOOD_GROUPS.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Marital Status">
              <select value={draft.marital_status||''} onChange={e=>update({marital_status:e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of Birth" required><TI type="date" value={draft.dob} onChange={v=>update({dob:v})} /></Field>
            <Field label="Date of Joining"><TI type="date" value={draft.joining_date} onChange={v=>update({joining_date:v})} className="bg-gray-50" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Personal Email" required><TI type="email" value={user?.personalEmail||''} onChange={()=>{}} className="bg-gray-50" /></Field>
            <Field label="PAN Number"><TI value={draft.pan_number} onChange={v=>update({pan_number:v.toUpperCase()})} placeholder="ABCDE1234F" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Place of Birth"><TI value={draft.place_of_birth} onChange={v=>update({place_of_birth:v})} /></Field>
            <Field label="District"><TI value={draft.district} onChange={v=>update({district:v})} /></Field>
            <Field label="Aadhaar Number"><TI value={draft.aadhaar_number} onChange={v=>update({aadhaar_number:v})} placeholder="XXXX XXXX XXXX" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Passport No"><TI value={draft.passport_number} onChange={v=>update({passport_number:v})} /></Field>
            <Field label="Passport Expiry"><TI type="date" value={draft.passport_expiry} onChange={v=>update({passport_expiry:v})} /></Field>
            <Field label="Place of Issue"><TI value={draft.passport_place} onChange={v=>update({passport_place:v})} /></Field>
          </div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Emergency Contact Details</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact 1 (Name & Phone)"><TI value={draft.emergency_contact_1} onChange={v=>update({emergency_contact_1:v})} placeholder="Name, +91 9876543210" /></Field>
            <Field label="Contact 2 (Name & Phone)"><TI value={draft.emergency_contact_2} onChange={v=>update({emergency_contact_2:v})} placeholder="Name, +91 9876543210" /></Field>
          </div>
        </div>
      )}

      {/* ─── Section 1: Address ─── */}
      {section===1 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">Present Address</p>
          <Field label="Street Address"><textarea rows={2} value={draft.present_address||''} onChange={e=>update({present_address:e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City"><TI value={draft.present_city} onChange={v=>update({present_city:v})} /></Field>
            <Field label="State"><TI value={draft.present_state} onChange={v=>update({present_state:v})} /></Field>
            <Field label="Pin Code"><TI value={draft.present_pincode} onChange={v=>update({present_pincode:v})} /></Field>
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-4">Permanent Address</p>
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" id="sameas" onChange={e => {
              if (e.target.checked) update({
                permanent_address: draft.present_address, permanent_city: draft.present_city,
                permanent_state: draft.present_state, permanent_pincode: draft.present_pincode,
                permanent_phone: draft.present_phone,
              });
            }} className="rounded" />
            <label htmlFor="sameas" className="text-xs text-gray-500">Same as Present Address</label>
          </div>
          <Field label="Street Address"><textarea rows={2} value={draft.permanent_address||''} onChange={e=>update({permanent_address:e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City"><TI value={draft.permanent_city} onChange={v=>update({permanent_city:v})} /></Field>
            <Field label="State"><TI value={draft.permanent_state} onChange={v=>update({permanent_state:v})} /></Field>
            <Field label="Pin Code"><TI value={draft.permanent_pincode} onChange={v=>update({permanent_pincode:v})} /></Field>
          </div>
          <Field label="Permanent Phone"><TI value={draft.permanent_phone} onChange={v=>update({permanent_phone:v})} /></Field>
        </div>
      )}

      {/* ─── Section 2: Identity Docs — shown as read-only notice ─── */}
      {section===2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
          <p className="font-semibold">Identity Documents</p>
          <p>Please ensure the following are entered correctly in Section 1 (Personal Details):</p>
          <ul className="list-disc ml-5 space-y-1 text-blue-700">
            <li>Aadhaar Number</li><li>PAN Number</li><li>Passport Number, Expiry & Place of Issue</li>
          </ul>
          <p className="mt-2">You will upload scanned copies of these documents in the next onboarding step (after HR approves these forms).</p>
        </div>
      )}

      {/* ─── Section 3: Qualifications ─── */}
      {section===3 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Qualification Details</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Qualification</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Institution & Location</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">%</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Duration</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {quals.map((q,i)=>(
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-700 bg-gray-50 whitespace-nowrap">{q.level||QUAL_LEVELS[i]}</td>
                    <td className="px-3 py-2"><input value={q.institution||''} onChange={e=>qual(i,'institution',e.target.value)}
                      placeholder="Institution, City" className="w-full text-sm border-0 focus:outline-none bg-transparent" /></td>
                    <td className="px-3 py-2"><input value={q.percentage||''} onChange={e=>qual(i,'percentage',e.target.value)}
                      placeholder="85%" className="w-16 text-sm border-0 focus:outline-none bg-transparent" /></td>
                    <td className="px-3 py-2"><input value={q.duration||''} onChange={e=>qual(i,'duration',e.target.value)}
                      placeholder="2018-2020" className="w-24 text-sm border-0 focus:outline-none bg-transparent" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Section 4: Employment History ─── */}
      {section===4 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Employment History (most recent first)</p>
            <button onClick={addEmpRow} className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded-lg hover:bg-blue-50">+ Add Row</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr>
                {['Organisation, Location & Tel','Designation','Job Description','From','To'].map(h=>(
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {emp.map((e,i)=>(
                  <tr key={i}>
                    <td className="px-2 py-1"><input value={e.org||''} onChange={v=>empRow(i,'org',v.target.value)} className="w-full text-sm border-0 focus:outline-none" placeholder="Company name" /></td>
                    <td className="px-2 py-1"><input value={e.designation||''} onChange={v=>empRow(i,'designation',v.target.value)} className="w-full text-sm border-0 focus:outline-none" placeholder="Role" /></td>
                    <td className="px-2 py-1"><input value={e.description||''} onChange={v=>empRow(i,'description',v.target.value)} className="w-full text-sm border-0 focus:outline-none" placeholder="Brief" /></td>
                    <td className="px-2 py-1"><input type="date" value={e.from_date||''} onChange={v=>empRow(i,'from_date',v.target.value)} className="text-sm border-0 focus:outline-none" /></td>
                    <td className="px-2 py-1"><input type="date" value={e.to_date||''} onChange={v=>empRow(i,'to_date',v.target.value)} className="text-sm border-0 focus:outline-none" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Section 5: Family & Other ─── */}
      {section===5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Family Details</p>
            <button onClick={addFamRow} className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded-lg hover:bg-blue-50">+ Add Row</button>
          </div>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50"><tr>
              {['Name','Relationship','Age / DOB','Occupation','Blood Group'].map(h=>(
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {fam.map((f,i)=>(
                <tr key={i}>
                  <td className="px-2 py-1"><input value={f.name||''} onChange={v=>famRow(i,'name',v.target.value)} className="w-full text-sm border-0 focus:outline-none" /></td>
                  <td className="px-2 py-1"><input value={f.relationship||''} onChange={v=>famRow(i,'relationship',v.target.value)} className="w-full text-sm border-0 focus:outline-none" /></td>
                  <td className="px-2 py-1"><input type="date" value={f.dob||''} onChange={v=>famRow(i,'dob',v.target.value)} className="text-sm border-0 focus:outline-none" /></td>
                  <td className="px-2 py-1"><input value={f.occupation||''} onChange={v=>famRow(i,'occupation',v.target.value)} className="w-full text-sm border-0 focus:outline-none" /></td>
                  <td className="px-2 py-1">
                    <select value={f.blood_group||''} onChange={v=>famRow(i,'blood_group',v.target.value)} className="text-sm border-0 focus:outline-none bg-transparent">
                      <option value=""></option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Field label="Professional Associations / Networks">
            <textarea rows={2} value={draft.professional_associations||''} onChange={e=>update({professional_associations:e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full" />
          </Field>
          <Field label="Interests / Hobbies">
            <textarea rows={2} value={draft.hobbies||''} onChange={e=>update({hobbies:e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full" />
          </Field>
          <Field label="Any Serious Illness">
            <textarea rows={2} value={draft.serious_illness||''} onChange={e=>update({serious_illness:e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full" />
          </Field>
          <Field label="Any Other Information">
            <textarea rows={2} value={draft.other_info||''} onChange={e=>update({other_info:e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full" />
          </Field>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          {section > 0 && <button onClick={()=>setSection(s=>s-1)} className="text-sm text-gray-500 hover:text-gray-700">← Prev Section</button>}
          {section < SECTIONS.length-1 && <button onClick={()=>setSection(s=>s+1)} className="text-sm text-blue-600 hover:text-blue-800">Next Section →</button>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onBack}>← Back</Button>
          <Button onClick={onNext} loading={saving}>Save & Continue →</Button>
        </div>
      </div>
    </div>
  );
}
