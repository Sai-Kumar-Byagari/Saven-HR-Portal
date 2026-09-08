import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { policiesApi } from '../../api/policies.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatIndianDate } from '../../utils/dateHelpers';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const CATEGORIES = ['Leave Policy', 'Code of Conduct', 'IT Policy', 'HR Policy', 'Finance Policy', 'Travel Policy', 'Other'];

export default function PoliciesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = ['super_admin', 'hr'].includes(role);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Other');
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => { const r = await policiesApi.getAll(); return r.data; },
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      fd.append('category', category);
      return policiesApi.upload(fd);
    },
    onSuccess: () => {
      toast.success('Policy uploaded and all employees notified!');
      setShowUpload(false); setTitle(''); setCategory('Other'); setFile(null);
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => policiesApi.delete(id),
    onSuccess: () => {
      toast.success('Policy deleted.');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const categoryColors = {
    'Leave Policy': 'bg-blue-50 text-blue-700 border-blue-200',
    'Code of Conduct': 'bg-purple-50 text-purple-700 border-purple-200',
    'IT Policy': 'bg-orange-50 text-orange-700 border-orange-200',
    'HR Policy': 'bg-green-50 text-green-700 border-green-200',
    'Finance Policy': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Travel Policy': 'bg-pink-50 text-pink-700 border-pink-200',
    'Other': 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
          <p className="text-gray-500 text-sm mt-1">Company policies and guidelines</p>
        </div>
        {canManage && <Button onClick={() => setShowUpload(true)}>Upload Policy</Button>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.data || []).map((p) => (
            <div key={p.id} className={`rounded-xl border p-5 ${categoryColors[p.category] || categoryColors['Other']}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-xs opacity-70 mt-0.5">{p.category}</p>
                  <p className="text-xs opacity-60 mt-1">Uploaded {formatIndianDate(p.created_at)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={`${apiBase}/uploads/${p.file_path}`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-black/10 transition-colors"
                    aria-label={`Download ${p.title}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  {canManage && (
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors" aria-label={`Delete ${p.title}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.data?.length === 0 && (
            <p className="col-span-3 text-center py-10 text-gray-400">No policies uploaded yet</p>
          )}
        </div>
      )}

      {/* Upload modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Policy" size="sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leave Policy 2025"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">PDF File <span className="text-red-500">*</span></label>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
            <button onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-blue-400 transition-colors text-left">
              {file ? `✓ ${file.name}` : 'Click to select PDF file'}
            </button>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={() => uploadMutation.mutate()} loading={uploadMutation.isPending}
              disabled={!file || !title.trim()}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}
        title="Delete Policy" message="This will permanently delete the policy. Are you sure?" confirmLabel="Delete" />
    </div>
  );
}
