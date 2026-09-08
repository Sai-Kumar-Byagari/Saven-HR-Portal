import { useQuery } from '@tanstack/react-query';
import { payrollApi } from '../../api/payroll.api';
import { getFileUrl } from '../../utils/fileUrl';
import Spinner from '../../components/ui/Spinner';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function getMonthName(m) { return MONTHS[(m||1)-1] || m; }

export default function MyPayslipsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payroll', 'my'],
    queryFn: async () => { const r = await payrollApi.getMy({ limit: 50 }); return r.data.data || []; },
    staleTime: 0,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const payslips = data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Payslips</h1>
        <p className="text-gray-400 text-sm mt-0.5">View your monthly payslips uploaded by HR/Payroll</p>
      </div>

      {payslips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <p className="text-3xl mb-3">₹</p>
          <p className="text-gray-500 font-medium">No payslips yet</p>
          <p className="text-sm text-gray-400 mt-1">Your payroll team will upload your payslips here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map(slip => (
            <div key={slip.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900 text-base">{getMonthName(slip.month)} {slip.year}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Payslip</p>
                </div>
                <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-green-700 font-bold text-lg">₹</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                {slip.slip_path ? (
                  <a href={getFileUrl(slip.slip_path)} target="_blank" rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 text-sm text-blue-600 border border-blue-300 bg-blue-50 px-4 py-2.5 rounded-lg hover:bg-blue-100 transition-colors font-semibold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    View Payslip
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">File not available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
