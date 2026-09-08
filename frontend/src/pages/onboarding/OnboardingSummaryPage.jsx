import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../../api/onboarding.api';
import { formatIndianDate } from '../../utils/dateHelpers';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function OnboardingSummaryPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding', 'summary'],
    queryFn: async () => { const r = await onboardingApi.getSummary({ limit: 50 }); return r.data; },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Summary</h1>
        <p className="text-gray-500 text-sm mt-1">
          {data?.pagination?.total || data?.data?.length || 0} employee(s) with pending onboarding
        </p>
      </div>

      {(data?.data || []).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">All employees have completed onboarding 🎉</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Employee', 'Work Email', 'Date of Joining', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.data || []).map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.first_name} {emp.last_name}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.work_email}</td>
                  <td className="px-4 py-3 text-gray-500">{formatIndianDate(emp.doj)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.onboarding_complete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {emp.onboarding_complete ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/employees/${emp.id}`)}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
