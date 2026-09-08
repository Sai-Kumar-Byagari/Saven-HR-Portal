import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directoryApi } from '../../api/directory.api';
import Avatar from '../../components/ui/Avatar';
import { ROLE_LABELS, ROLE_COLORS } from '../../config/roles';
import Pagination from '../../components/ui/Pagination';

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['directory', page, search],
    queryFn: async () => {
      const r = await directoryApi.getAll({ page, limit: 24, search });
      return r.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
        <p className="text-gray-500 text-sm mt-1">Find and connect with your colleagues</p>
      </div>

      <input
        type="search"
        placeholder="Search by name, designation, or email..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Search directory"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(data?.data || []).map((emp) => (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-3">
                  <Avatar name={emp.fullName} role={emp.role} photo={emp.profilePhoto} size="lg" />
                </div>
                <p className="font-semibold text-gray-900">{emp.fullName}</p>
                <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[emp.role]}`}>
                  {ROLE_LABELS[emp.role]}
                </span>
                <div className="mt-2">
                  <a href={`mailto:${emp.workEmail}`} className="text-xs text-blue-600 hover:underline block truncate">
                    {emp.workEmail}
                  </a>
                </div>
              </div>
            ))}
            {data?.data?.length === 0 && (
              <p className="col-span-4 text-center py-10 text-gray-400">No employees found</p>
            )}
          </div>
          <Pagination pagination={data?.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
