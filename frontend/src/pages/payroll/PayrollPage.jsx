import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { payrollApi } from '../../api/payroll.api';
import { queryClient } from '../../config/queryClient';
import { getFileUrl } from '../../utils/fileUrl';
import { formatIndianDate } from '../../utils/dateHelpers';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getMonthName(m) { return MONTHS[(m||1)-1] || m; }

export default function PayrollPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [filterEmpId, setFilterEmpId] = useState('');
  const [form, setForm] = useState({
    emp_id: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), note: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', 'all', filterEmpId],
    queryFn: async () => {
      const r = await payrollApi.getAll({ limit: 100, emp_id: filterEmpId || undefined });
      return r.data.data || [];
    },
    staleTime: 0,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('emp_id', form.emp_id);
      fd.append('month', form.month);
      fd.append('year', form.year);
      if (form.note) fd.append('note', form.note);
      fd.append('payslip', selectedFile);
      return payrollApi.upload(fd);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowUpload(false);
      setForm({ emp_id:'', month: String(new Date().getMonth()+1), year: String(new Date().getFullYear()), note:'' });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  const payslips = data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">Upload payslips to employees by Employee ID</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>+ Upload Payslip</Button>
      </div>

      {/* Filter by emp_id */}
      <div className="flex items-center gap-3">
        <input value={filterEmpId} onChange={e => setFilterEmpId(e.target.value)}
          placeholder="Filter by Employee ID..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        {filterEmpId && <button onClick={() => setFilterEmpId('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
      </div>

      {/* Records table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : payslips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-3xl mb-3">💰</p>
          <p className="text-gray-500 font-medium">No payslips uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload a payslip using the button above</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Emp ID','Employee','Period','Uploaded','File'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payslips.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {p.employee?.emp_id || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.employee?.first_name} {p.employee?.last_name}</p>
                    <p className="text-xs text-gray-400">{p.employee?.work_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{getMonthName(p.month)} {p.year}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {p.created_at || p.createdAt
                      ? new Date(p.created_at || p.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true,
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.slip_path ? (
                      <a href={getFileUrl(p.slip_path)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">No file</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setSelectedFile(null); }} title="Upload Payslip" size="sm">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            Enter the employee's Employee ID and upload their payslip file (PDF or image). They will be notified automatically.
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Employee ID <span className="text-red-500">*</span></label>
            <input value={form.emp_id} onChange={e => setForm(p=>({...p, emp_id: e.target.value}))}
              placeholder="e.g. SAV001"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Month <span className="text-red-500">*</span></label>
              <select value={form.month} onChange={e => setForm(p=>({...p, month: e.target.value}))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Year <span className="text-red-500">*</span></label>
              <input type="number" value={form.year} onChange={e => setForm(p=>({...p, year: e.target.value}))}
                min="2020" max="2099"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* File upload */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Payslip File <span className="text-red-500">*</span></label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-4 text-sm transition-colors ${selectedFile ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}>
              {selectedFile ? (
                <span className="flex items-center justify-center gap-2">✅ {selectedFile.name}</span>
              ) : (
                <span>📁 Click to select PDF or image</span>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowUpload(false); setSelectedFile(null); }}>Cancel</Button>
            <Button loading={uploadMutation.isPending}
              disabled={!form.emp_id.trim() || !selectedFile || !form.month || !form.year}
              onClick={() => uploadMutation.mutate()}
              className="flex-1">
              Upload & Send
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
