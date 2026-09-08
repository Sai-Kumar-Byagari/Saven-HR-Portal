import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { recruitmentApi } from '../../api/recruitment.api';
import { queryClient } from '../../config/queryClient';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function CandidateListPage() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { data: position } = useQuery({
    queryKey: ['positions', positionId],
    queryFn: async () => { const r = await recruitmentApi.getPosition(positionId); return r.data.data; },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', positionId],
    queryFn: async () => { const r = await recruitmentApi.getCandidates(positionId); return r.data; },
  });

  const uploadMutation = useMutation({
    mutationFn: (files) => {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('resumes', f));
      return recruitmentApi.uploadResumes(positionId, formData);
    },
    onSuccess: () => {
      toast.success('Resumes uploaded and AI shortlisting complete!');
      queryClient.invalidateQueries({ queryKey: ['candidates', positionId] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  function handleFileChange(e) {
    if (e.target.files?.length) uploadMutation.mutate(e.target.files);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{position?.title || 'Candidates'}</h1>
          <p className="text-gray-500 text-sm mt-1">{position?.department} · {data?.pagination?.total || 0} candidates</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx" className="hidden" onChange={handleFileChange} aria-label="Upload resumes" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} loading={uploadMutation.isPending}>
            {uploadMutation.isPending ? 'AI Processing...' : '🤖 Upload & Shortlist'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {(data?.data || []).map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email || 'No email'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {c.ai_score != null && (
                  <div className="text-center">
                    <p className={`text-lg font-bold ${c.ai_score >= 70 ? 'text-green-600' : c.ai_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {c.ai_score}
                    </p>
                    <p className="text-xs text-gray-400">AI Score</p>
                  </div>
                )}
                <StatusBadge status={c.status} />
                <Button size="sm" variant="outline" onClick={() => navigate(`/recruitment/candidates/${c.id}`)}>
                  View
                </Button>
              </div>
            </div>
          ))}
          {data?.data?.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p>No candidates yet. Upload resumes to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
